import { finaliseTransaction } from '../finalise-transaction.js'
import {
  MOCK_END_DATE,
  MOCK_PERMISSION_NUMBER,
  MOCK_OBFUSCATED_DOB,
  mockTransactionPayload,
  mockStagedTransactionRecord
} from '../../../__mocks__/test-data.js'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../../../config.js'
import BusinessRulesLib from '@defra-fish/business-rules-lib'
import moment from 'moment'
import { TRANSACTION_STATUS } from '../constants.js'
import permissionsService from '../../permissions.service.js'
import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { AWS } from '@defra-fish/connectors-lib'

const { START_AFTER_PAYMENT_MINUTES } = BusinessRulesLib

jest.mock('../../permissions.service.js', () => ({
  generatePermissionNumber: jest.fn(() => MOCK_PERMISSION_NUMBER),
  calculateEndDate: jest.fn(() => MOCK_END_DATE)
}))

jest.mock('../../contacts.service.js', () => ({
  getObfuscatedDob: () => MOCK_OBFUSCATED_DOB
}))

jest.mock('@defra-fish/business-rules-lib', () => ({
  POCL_TRANSACTION_SOURCES: ['Post Office Sales', 'DDE File'],
  START_AFTER_PAYMENT_MINUTES: 30
}))

jest.mock('@defra-fish/connectors-lib', () => {
  const mockDocClient = {
    send: jest.fn(),
    createUpdateExpression: jest.fn()
  }
  const mockSqs = {
    sendMessage: jest.fn()
  }
  return {
    AWS: jest.fn(() => ({
      docClient: mockDocClient,
      sqs: mockSqs
    }))
  }
})

const { docClient, sqs } = AWS.mock.results[0].value

const getStagedTransactionRecord = () => {
  const record = mockStagedTransactionRecord()
  const {
    permissions: [permission]
  } = record
  permission.issueDate = moment(permission.issueDate).year(2021).toISOString()
  permission.startDate = moment(permission.startDate).add(START_AFTER_PAYMENT_MINUTES, 'minutes').toISOString()
  return record
}

// helper function - GetCommand
const expectDynamoDbGet = mockRecord => {
  const getCommandInstance = docClient.send.mock.calls[0][0]
  expect(getCommandInstance.input).toEqual({
    TableName: TRANSACTION_STAGING_TABLE.TableName,
    Key: { id: mockRecord.id },
    ConsistentRead: true
  })
}

// helper function - UpdateCommand
const expectDynamoDbUpdate = (mockRecord, completionFields) => {
  const updateCommandInstance = docClient.send.mock.calls[1][0]
  expect(updateCommandInstance.input).toEqual({
    TableName: TRANSACTION_STAGING_TABLE.TableName,
    Key: { id: mockRecord.id },
    ...docClient.createUpdateExpression({
      ...completionFields,
      permissions: mockRecord.permissions.map(p => ({
        ...p,
        issueDate: p.issueDate ?? completionFields.payment.timestamp,
        startDate: p.startDate ?? moment(completionFields.payment.timestamp).add(START_AFTER_PAYMENT_MINUTES, 'minutes').toISOString(),
        endDate: expect.any(String),
        referenceNumber: expect.any(String),
        licensee: {
          ...p.licensee,
          obfuscatedDob: expect.any(String)
        }
      })),
      status: { id: TRANSACTION_STATUS.FINALISED }
    }),
    ReturnValues: 'ALL_NEW'
  })
}

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
    TRANSACTION_QUEUE.Url = 'TestQueueUrl'
  })

  describe('finaliseTransaction', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it.each([
      ['records with a predetermined issue and start date', getStagedTransactionRecord],
      [
        'records with a null issue and start date',
        () => {
          const record = getStagedTransactionRecord()
          record.permissions = record.permissions.map(p => ({ ...p, issueDate: null, startDate: null }))
          return record
        }
      ]
    ])('finalises a transaction and enqueues a message to sqs for %s', async (description, mockRecordProducer) => {
      const mockRecord = mockRecordProducer()
      const completionFields = {
        payment: {
          amount: 30,
          timestamp: new Date().toISOString(),
          type: 'Gov Pay',
          method: 'Debit card'
        }
      }

      docClient.send.mockResolvedValueOnce({ Item: mockRecord })
      docClient.send.mockResolvedValueOnce({
        Attributes: { ...mockRecord, ...completionFields, status: { id: TRANSACTION_STATUS.FINALISED } }
      })
      sqs.sendMessage.mockResolvedValueOnce({ MessageId: 'Test_Message' })

      const result = await finaliseTransaction({ id: mockRecord.id, ...completionFields })

      expect(result).toEqual({
        ...mockRecord,
        ...completionFields,
        status: { id: TRANSACTION_STATUS.FINALISED, messageId: 'Test_Message' }
      })

      expectDynamoDbGet(mockRecord)
      expectDynamoDbUpdate(mockRecord, completionFields)

      expect(sqs.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          QueueUrl: TRANSACTION_QUEUE.Url,
          MessageGroupId: mockRecord.id,
          MessageDeduplicationId: mockRecord.id,
          MessageBody: JSON.stringify({ id: mockRecord.id })
        })
      )
    })

    it('throws 410 Gone if the transaction has already been finalised (and not yet staged into Dynamics)', async () => {
      const recordData = { status: { id: 'FINALISED' } }
      docClient.send.mockResolvedValueOnce({ Item: recordData })
      try {
        await finaliseTransaction({ id: 'already_finalised' })
      } catch (e) {
        expect(e.message).toEqual('The transaction has already been finalised')
        expect(e.data).toEqual(recordData)
        expect(e.output.statusCode).toEqual(410)
      }
    })

    it('throws 410 Gone if the transaction has already been finalised (and staged into Dynamics)', async () => {
      const recordData = { status: { id: 'FINALISED' } }
      // See retrieve-transaction.js - 1st response is null on the transaction table, 2nd response is the record from the transaction history table
      docClient.send.mockResolvedValueOnce({ Item: null })
      docClient.send.mockResolvedValueOnce({ Item: recordData })
      try {
        await finaliseTransaction({ id: 'already_finalised' })
      } catch (e) {
        expect(e.message).toEqual('The transaction has already been finalised')
        expect(e.data).toEqual(recordData)
        expect(e.output.statusCode).toEqual(410)
      }
    })

    it('throws 404 not found error if a record cannot be found for the given id', async () => {
      docClient.send.mockResolvedValueOnce({ Item: undefined })
      try {
        await finaliseTransaction({ id: 'not_found' })
      } catch (e) {
        expect(e.message).toEqual('A transaction for the specified identifier was not found')
        expect(e.output.statusCode).toEqual(404)
      }
    })

    it('throws 402 Payment Required error if the payment amount does not match the cost', async () => {
      const mockRecord = mockStagedTransactionRecord()
      docClient.send.mockResolvedValueOnce({ Item: mockRecord })
      try {
        const payload = {
          payment: {
            amount: 0,
            timestamp: new Date().toISOString(),
            type: 'Gov Pay',
            method: 'Debit card'
          }
        }
        await finaliseTransaction({ id: mockRecord.id, ...payload })
      } catch (e) {
        expect(e.message).toEqual('The payment amount did not match the cost of the transaction')
        expect(e.output.statusCode).toEqual(402)
      }
    })

    it('throws 409 Conflict error if a recurring payment instruction was supplied but the transaction does not support this', async () => {
      const mockRecord = { ...mockStagedTransactionRecord(), isRecurringPaymentSupported: false }
      docClient.send.mockResolvedValueOnce({ Item: mockRecord })
      try {
        const payload = {
          payment: {
            amount: 30,
            timestamp: new Date().toISOString(),
            type: 'Gov Pay',
            method: 'Debit card',
            recurring: {
              contact: {
                firstName: 'Fester',
                lastName: 'Tester',
                birthDate: '2000-01-01',
                email: 'person@example.com',
                mobilePhone: '+44 7700 900088',
                premises: 'Example House',
                street: 'Example Street',
                locality: 'Near Sample',
                town: 'Exampleton',
                postcode: 'AB12 3CD',
                country: 'GB',
                preferredMethodOfConfirmation: 'Text',
                preferredMethodOfNewsletter: 'Email',
                preferredMethodOfReminder: 'Letter',
                postalFulfilment: false
              },
              referenceNumber: '1a0921f3-5c54-41ab-9ccd-097511c854f1',
              mandate: 'cb74dd42-6e95-46c5-9531-aa3e510e574f'
            }
          }
        }
        await finaliseTransaction({ id: mockRecord.id, ...payload })
      } catch (e) {
        expect(e.message).toEqual('The transaction does not support recurring payments but an instruction was supplied')
        expect(e.output.statusCode).toEqual(409)
      }
    })

    it('throws exceptions back up the stack', async () => {
      docClient.send.mockRejectedValueOnce(new Error('Test error'))
      await expect(finaliseTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })

  describe('finaliseTransaction adjusts licence times according to issue date and start date', () => {
    beforeEach(() => {
      BusinessRulesLib.START_AFTER_PAYMENT_MINUTES = 30
      jest.clearAllMocks()
    })

    const mockCreateUpdateExpression = (completionFields, updatedPermissions) => {
      docClient.createUpdateExpression.mockReturnValue({
        UpdateExpression: 'SET #payment = :payment, #permissions = :permissions, #status = :status',
        ExpressionAttributeNames: {
          '#payment': 'payment',
          '#permissions': 'permissions',
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':payment': completionFields.payment,
          ':permissions': updatedPermissions,
          ':status': {
            id: TRANSACTION_STATUS.FINALISED
          }
        }
      })
    }

    it.each([
      ['2021-09-30T17:14:01.892Z', '2021-09-30T17:14:01.892Z', '2022-09-30T17:14:01.892Z', 22, 'Web Sales'],
      ['2021-09-30T23:14:01.892Z', '2021-09-30T23:00:49.892Z', '2022-09-30T23:00:49.892Z', 38, 'Web Sales'],
      ['2021-09-30T22:14:01.892Z', '2021-09-30T21:44:01.892Z', '2021-09-08T21:44:01.892Z', 47, 'Web Sales'],
      ['2021-09-30T00:14:01.892Z', '2021-09-29T17:14:01.892Z', '2022-09-30T17:14:01.892Z', 12, 'Telesales'],
      ['2021-11-30T23:14:01.892Z', '2021-11-30T22:22:01.892Z', '2022-11-30T22:22:01.892Z', 1, 'Telesales']
    ])(
      'adjusts startDate if startDate is less than 30 minutes after issueDate',
      async (issueDate, startDate, endDate, startAfterPaymentMinutes, dataSource) => {
        BusinessRulesLib.START_AFTER_PAYMENT_MINUTES = startAfterPaymentMinutes
        const mockRecord = mockStagedTransactionRecord()
        mockRecord.dataSource = dataSource
        const [mockPermission] = mockRecord.permissions
        mockPermission.issueDate = issueDate
        mockPermission.startDate = startDate
        mockPermission.endDate = endDate
        const completionFields = getCompletionFields()

        const expectedPermissions = mockRecord.permissions.map(p => ({
          ...p,
          issueDate: p.issueDate ?? completionFields.payment.timestamp,
          startDate: moment(issueDate).add(startAfterPaymentMinutes, 'minutes').toISOString(),
          endDate: expect.any(String),
          referenceNumber: expect.any(String),
          licensee: {
            ...p.licensee,
            obfuscatedDob: expect.any(String)
          }
        }))

        mockCreateUpdateExpression(completionFields, expectedPermissions)

        docClient.send = jest.fn(command => {
          if (command instanceof GetCommand) {
            return Promise.resolve({ Item: mockRecord })
          } else if (command instanceof UpdateCommand) {
            return Promise.resolve({
              Attributes: { ...mockRecord, ...completionFields, status: { id: TRANSACTION_STATUS.FINALISED } }
            })
          } else {
            return Promise.reject(new Error('Unknown command'))
          }
        })
        sqs.sendMessage.mockResolvedValueOnce({ MessageId: 'Test_Message' })

        await finaliseTransaction({ id: mockRecord.id, ...completionFields })

        const updateCommandInstance = docClient.send.mock.calls.find(call => call[0] instanceof UpdateCommand)[0]
        const updatedPermissions = updateCommandInstance.input.ExpressionAttributeValues[':permissions']
        expect(updatedPermissions[0]).toEqual(
          expect.objectContaining({
            permitId: mockPermission.permitId,
            startDate: moment(issueDate).add(startAfterPaymentMinutes, 'minutes').toISOString()
          })
        )
      }
    )

    it.each([
      ['2021-09-30T17:14:01.892Z', '2021-09-30T17:44:02.892Z', '2022-09-30T17:44:02.892Z'],
      ['2021-09-30T23:14:01.892Z', '2021-10-01T09:00:00.000Z', '2022-10-01T09:00:00.000Z'],
      ['2021-02-28T22:14:01.892Z', '2021-03-01T06:00:00.000Z', '2021-03-02T06:00:00.000Z']
    ])('leaves startDate unmodified if it is more than 30 minutes after issueDate', async (issueDate, startDate, endDate) => {
      const mockRecord = mockStagedTransactionRecord()
      const [mockPermission] = mockRecord.permissions
      mockPermission.issueDate = issueDate
      mockPermission.startDate = startDate
      mockPermission.endDate = endDate
      const completionFields = getCompletionFields()

      const expectedPermissions = mockRecord.permissions.map(p => ({
        ...p,
        issueDate: p.issueDate ?? completionFields.payment.timestamp,
        startDate,
        endDate: expect.any(String),
        referenceNumber: expect.any(String),
        licensee: {
          ...p.licensee,
          obfuscatedDob: expect.any(String)
        }
      }))

      mockCreateUpdateExpression(completionFields, expectedPermissions)

      docClient.send = jest.fn(command => {
        if (command instanceof GetCommand) {
          return Promise.resolve({ Item: mockRecord })
        } else if (command instanceof UpdateCommand) {
          return Promise.resolve({
            Attributes: { ...mockRecord, ...completionFields, status: { id: TRANSACTION_STATUS.FINALISED } }
          })
        } else {
          return Promise.reject(new Error('Unknown command'))
        }
      })
      sqs.sendMessage.mockResolvedValueOnce({ MessageId: 'Test_Message' })

      await finaliseTransaction({ id: mockRecord.id, ...completionFields })

      const updateCommandInstance = docClient.send.mock.calls[1][0]
      const updatedPermissions = updateCommandInstance.input.ExpressionAttributeValues[':permissions']
      expect(updatedPermissions[0]).toEqual(
        expect.objectContaining({
          permitId: mockPermission.permitId,
          startDate
        })
      )
    })

    it.each([
      ['2021-09-30T17:14:01.892Z', '2021-09-30T17:14:01.892Z', '2023-09-30T17:14:01.892Z'],
      ['2021-09-30T23:14:01.892Z', '2021-09-30T23:00:49.892Z', '2024-09-30T23:00:49.892Z'],
      ['2021-09-30T22:14:01.892Z', '2021-09-30T09:00:00.000Z', '2021-10-01T19:00:00.000Z'],
      ['2021-09-30T00:14:01.892Z', '2021-09-29T17:14:01.892Z', '2021-10-01T07:14:01.892Z'],
      ['2021-11-30T23:14:01.892Z', '2021-11-30T22:22:01.892Z', '2021-11-08T12:22:01.892Z'],
      ['2021-09-30T22:14:01.892Z', '2021-09-30T22:45:00.000Z', '2021-10-01T02:45:00.000Z']
    ])('uses endDate given by permissions end date calculator', async (issueDate, startDate, endDate) => {
      permissionsService.calculateEndDate.mockReturnValueOnce(endDate)
      const mockRecord = mockStagedTransactionRecord()
      const [mockPermission] = mockRecord.permissions
      mockPermission.issueDate = issueDate
      mockPermission.startDate = startDate
      const completionFields = getCompletionFields()

      const expectedPermissions = mockRecord.permissions.map(p => ({
        ...p,
        issueDate: p.issueDate ?? completionFields.payment.timestamp,
        startDate: p.startDate ?? moment(completionFields.payment.timestamp).add(START_AFTER_PAYMENT_MINUTES, 'minutes').toISOString(),
        endDate,
        referenceNumber: expect.any(String),
        licensee: {
          ...p.licensee,
          obfuscatedDob: expect.any(String)
        }
      }))

      mockCreateUpdateExpression(completionFields, expectedPermissions)

      docClient.send = jest.fn(command => {
        if (command instanceof GetCommand) {
          return Promise.resolve({ Item: mockRecord })
        } else if (command instanceof UpdateCommand) {
          return Promise.resolve({
            Attributes: { ...mockRecord, ...completionFields, status: { id: TRANSACTION_STATUS.FINALISED } }
          })
        } else {
          return Promise.reject(new Error('Unknown command'))
        }
      })
      sqs.sendMessage.mockResolvedValueOnce({ MessageId: 'Test_Message' })

      await finaliseTransaction({ id: mockRecord.id, ...completionFields })

      const updateCommandInstance = docClient.send.mock.calls[1][0]
      const updatedPermissions = updateCommandInstance.input.ExpressionAttributeValues[':permissions']
      expect(updatedPermissions[0]).toEqual(
        expect.objectContaining({
          permitId: mockPermission.permitId,
          endDate
        })
      )
    })

    it.each([
      ['2021-09-30T17:14:01.892Z', '2021-09-30T17:44:02.892Z', '2022-09-30T17:44:02.892Z'],
      ['2021-09-30T23:14:01.892Z', '2021-10-01T09:00:00.000Z', '2022-10-01T09:00:00.000Z'],
      ['2021-02-28T22:14:01.892Z', '2021-03-01T06:00:00.000Z', '2021-03-02T06:00:00.000Z']
    ])('leaves endDate unmodified if startDate is more than 30 minutes after issueDate', async (issueDate, startDate, endDate) => {
      permissionsService.calculateEndDate.mockReturnValueOnce(endDate)
      const mockRecord = mockStagedTransactionRecord()
      const [mockPermission] = mockRecord.permissions
      mockPermission.issueDate = issueDate
      mockPermission.startDate = startDate
      mockPermission.endDate = endDate
      const completionFields = getCompletionFields()

      const expectedPermissions = mockRecord.permissions.map(p => ({
        ...p,
        issueDate: p.issueDate ?? completionFields.payment.timestamp,
        startDate,
        endDate,
        referenceNumber: expect.any(String),
        licensee: {
          ...p.licensee,
          obfuscatedDob: expect.any(String)
        }
      }))

      mockCreateUpdateExpression(completionFields, expectedPermissions)

      docClient.send = jest.fn(command => {
        if (command instanceof GetCommand) {
          return Promise.resolve({ Item: mockRecord })
        } else if (command instanceof UpdateCommand) {
          return Promise.resolve({
            Attributes: { ...mockRecord, ...completionFields, status: { id: TRANSACTION_STATUS.FINALISED } }
          })
        } else {
          return Promise.reject(new Error('Unknown command'))
        }
      })
      sqs.sendMessage.mockResolvedValueOnce({ MessageId: 'Test_Message' })

      await finaliseTransaction({ id: mockRecord.id, ...completionFields })

      const updateCommandInstance = docClient.send.mock.calls[1][0]
      const updatedPermissions = updateCommandInstance.input.ExpressionAttributeValues[':permissions']
      expect(updatedPermissions[0]).toEqual(
        expect.objectContaining({
          permitId: mockPermission.permitId,
          endDate
        })
      )
    })

    it.each([
      ['2021-09-30T17:14:01.892Z', '2021-09-30T17:14:01.892Z', '2022-09-30T17:14:01.892Z', 'Post Office Sales'],
      ['2021-09-30T23:14:01.892Z', '2021-09-30T23:00:49.892Z', '2022-09-30T23:00:49.892Z', 'Post Office Sales'],
      ['2021-09-30T22:14:01.892Z', '2021-09-30T21:44:01.892Z', '2022-09-30T21:44:01.892Z', 'DDE File'],
      ['2021-09-30T00:14:01.892Z', '2021-09-29T17:14:01.892Z', '2022-09-29T17:14:01.892Z', 'DDE File']
    ])(
      'leaves start and end time unmodified for any data source type other than Web Sales and Telesales',
      async (issueDate, startDate, endDate, dataSource) => {
        permissionsService.calculateEndDate.mockReturnValueOnce(endDate)
        const mockRecord = mockStagedTransactionRecord()
        mockRecord.dataSource = dataSource
        const [mockPermission] = mockRecord.permissions
        mockPermission.issueDate = issueDate
        mockPermission.startDate = startDate
        mockPermission.endDate = endDate
        const completionFields = getCompletionFields()

        const expectedPermissions = mockRecord.permissions.map(p => ({
          ...p,
          issueDate: p.issueDate ?? completionFields.payment.timestamp,
          startDate,
          endDate,
          referenceNumber: expect.any(String),
          licensee: {
            ...p.licensee,
            obfuscatedDob: expect.any(String)
          }
        }))

        mockCreateUpdateExpression(completionFields, expectedPermissions)

        docClient.send = jest.fn(command => {
          if (command instanceof GetCommand) {
            return Promise.resolve({ Item: mockRecord })
          } else if (command instanceof UpdateCommand) {
            return Promise.resolve({
              Attributes: { ...mockRecord, ...completionFields, status: { id: TRANSACTION_STATUS.FINALISED } }
            })
          } else {
            return Promise.reject(new Error('Unknown command'))
          }
        })
        sqs.sendMessage.mockResolvedValueOnce({ MessageId: 'Test_Message' })

        await finaliseTransaction({ id: mockRecord.id, ...completionFields })

        const updateCommandInstance = docClient.send.mock.calls[1][0]
        const updatedPermissions = updateCommandInstance.input.ExpressionAttributeValues[':permissions']
        expect(updatedPermissions[0]).toEqual(
          expect.objectContaining({
            permitId: mockPermission.permitId,
            startDate,
            endDate
          })
        )
      }
    )

    it.each([
      ['2021-09-30T17:14:01.892Z', '2021-09-30T17:14:01.892Z'],
      ['2021-09-30T23:14:01.892Z', '2021-09-30T23:00:49.892Z'],
      ['2021-09-30T22:14:01.892Z', '2021-09-30T21:44:01.892Z']
    ])('passes a permission with a start date when generating a permission number', async (issueDate, expectedStartDate) => {
      const mockRecord = mockStagedTransactionRecord()
      const [mockPermission] = mockRecord.permissions
      const completionFields = getCompletionFields(issueDate)
      mockPermission.issueDate = issueDate
      delete mockPermission.startDate

      docClient.send = jest.fn(command => {
        if (command instanceof GetCommand) {
          return Promise.resolve({ Item: mockRecord })
        } else if (command instanceof UpdateCommand) {
          return Promise.resolve({
            Attributes: { ...mockRecord, ...completionFields, status: { id: TRANSACTION_STATUS.FINALISED } }
          })
        } else {
          return Promise.reject(new Error('Unknown command'))
        }
      })
      sqs.sendMessage.mockResolvedValueOnce({ MessageId: 'Test_Message' })

      let capturedPermission
      permissionsService.generatePermissionNumber.mockImplementationOnce(p => {
        capturedPermission = { ...p }
        return 'some-permission-number'
      })

      await finaliseTransaction({ id: mockRecord.id, ...completionFields })

      expect(capturedPermission).toEqual(
        expect.objectContaining({
          permitId: mockPermission.permitId,
          startDate: moment(completionFields.payment.timestamp).add(START_AFTER_PAYMENT_MINUTES, 'minutes').toISOString()
        })
      )
    })

    const getCompletionFields = (timestamp = new Date().toISOString()) => ({
      payment: {
        amount: 30,
        timestamp,
        type: 'Gov Pay',
        method: 'Debit card'
      }
    })
  })
})
