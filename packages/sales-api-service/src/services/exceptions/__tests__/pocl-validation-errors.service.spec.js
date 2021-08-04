import { createPoclValidationError, updatePoclValidationError } from '../pocl-validation-errors.service.js'
import { persist, findById, PoclValidationError } from '@defra-fish/dynamics-lib'
import Boom from '@hapi/boom'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  findById: jest.fn(),
  persist: jest.fn()
}))

const getPayload = () => ({
  id: 'test-id',
  createTransactionPayload: {
    dataSource: 'Post Office Sales',
    serialNumber: '14345-48457J',
    permissions: [{
      licensee: {
        firstName: 'Daniel',
        lastName: 'Ricciardo',
        organisation: 'Fishy Endeavours',
        premises: '14 Howecroft Court',
        street: 'Eastmead Lane',
        town: 'Bristol',
        postcode: 'BS9 1HJ',
        country: 'GB',
        birthDate: '1989-07-01',
        email: 'daniel-ricc@example.com',
        mobilePhone: '07722 123456',
        preferredMethodOfNewsletter: 'Prefer not to be contacted',
        preferredMethodOfConfirmation: 'Email',
        preferredMethodOfReminder: 'Text'
      },
      permitId: 'test-permit-id',
      startDate: '2021-06-15',
      concessions: [{ type: 'Blue Badge', referenceNumber: '123456789' }]
    }]
  },
  finaliseTransactionPayload: {
    payment: {
      timestamp: '2020-01-01T14:00:00Z',
      amount: 30,
      source: 'Post Office Sales',
      channelId: '948594',
      method: 'Cash'
    }
  },
  createTransactionError: {
    statusCode: 422,
    error: 'Data validation error',
    message: 'Error'
  }
})

const getValidationError = payload => ({
  ...payload.createTransactionPayload.permissions[0].licensee,
  serialNumber: payload.createTransactionPayload.serialNumber,
  dataSource: payload.createTransactionPayload.serialNumber.dataSource,
  transactionDate: payload.createTransactionPayload.permissions[0].issueDate,
  permitId: payload.createTransactionPayload.permissions[0].permitId,
  startDate: payload.createTransactionPayload.permissions[0].startDate,
  concessions: JSON.stringify(payload.createTransactionPayload.permissions[0].concessions),
  timestamp: payload.finaliseTransactionPayload.payment.timestamp,
  amount: payload.finaliseTransactionPayload.payment.amount,
  channelId: payload.finaliseTransactionPayload.payment.channelId,
  paymentSource: payload.finaliseTransactionPayload.payment.source,
  methodOfPayment: payload.finaliseTransactionPayload.payment.method,
  status: 'Ready for Processing',
  errorMessage: payload.errorMessage
})

describe('POCL validation error service', () => {
  beforeEach(jest.clearAllMocks)

  describe('createPoclValidationError', () => {
    let payload
    beforeEach(async () => {
      payload = getPayload()
      await createPoclValidationError(payload)
    })

    it('maps the record to an instance of PoclDataValidationError', async () => {
      const [poclValidationError] = persist.mock.calls[0][0]
      expect(poclValidationError).toBeInstanceOf(PoclValidationError)
    })

    it('creates the validation record', async () => {
      const [poclValidationError] = persist.mock.calls[0][0]
      expect(poclValidationError).toMatchSnapshot()
    })
  })

  describe('updatePoclValidationError', () => {
    let payload
    beforeEach(async () => {
      payload = getPayload()
      delete payload.createTransactionError
      payload.errorMessage = 'Invalid email address'
    })

    describe('when validation error record exists', () => {
      let poclValidationError
      beforeEach(async () => {
        findById.mockResolvedValue(getValidationError(payload))
        await updatePoclValidationError('pocl-validation-error-id', payload)
        poclValidationError = persist.mock.calls[0][0][0]
      })

      it('retrieves existing record', async () => {
        expect(findById).toBeCalledWith(PoclValidationError, 'pocl-validation-error-id')
      })

      describe('and status is not provided', () => {
        it('sets the status to "Needs Review"', async () => {
          expect(poclValidationError.status.label).toBe('Needs Review')
        })

        it('the state code is not set', async () => {
          expect(poclValidationError.stateCode).toBe(undefined)
        })

        it('updates the validation record', async () => {
          expect(poclValidationError).toMatchSnapshot()
        })
      })

      describe('and status equals "Processed"', () => {
        beforeEach(async () => {
          payload.status = 'Processed'
          await updatePoclValidationError('pocl-validation-error-id', payload)
        })

        it('the status is set to "Processed"', async () => {
          const [poclValidationError] = persist.mock.calls[0][0]
          expect(poclValidationError.status.label).toBe('Processed')
        })

        it('the state code is set to 1', async () => {
          const [poclValidationError] = persist.mock.calls[0][0]
          expect(poclValidationError.stateCode).toBe(1)
        })

        it('updates the validation record', async () => {
          const [poclValidationError] = persist.mock.calls[0][0]
          expect(poclValidationError).toMatchSnapshot()
        })
      })
    })

    describe('when the validation error record does not exist', () => {
      beforeEach(async () => {
        findById.mockResolvedValue(null)
      })

      it('throws a 404 error', async () => {
        await expect(
          updatePoclValidationError('pocl-validation-error-id', payload)
        ).rejects.toEqual(
          Boom.notFound('A POCL validation error with the given identifier could not be found')
        )
      })

      it('does not call persist to update record', async () => {
        try {
          await updatePoclValidationError('pocl-validation-error-id', payload)
        } catch (err) {}
        expect(persist).not.toBeCalled()
      })
    })
  })
})
