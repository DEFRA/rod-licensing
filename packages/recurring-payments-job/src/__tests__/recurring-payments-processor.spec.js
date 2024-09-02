import { salesApi } from '@defra-fish/connectors-lib'
import { processRecurringPayments, processPayment } from '../recurring-payments-processor.js'

jest.mock('@defra-fish/business-rules-lib')
jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    getDueRecurringPayments: jest.fn(() => []),
    preparePermissionDataForRenewal: jest.fn(() => ({
      licensee: { countryCode: 'GB-ENG' }
    })),
    createTransaction: jest.fn(),
    sendPayment: jest.fn(),
    processPayment: jest.fn()
  }
}))

describe('recurring-payments-processor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RUN_RECURRING_PAYMENTS = 'true'
  })

  it('console log displays "Recurring Payments job disabled" when env is false', async () => {
    process.env.RUN_RECURRING_PAYMENTS = 'false'
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())

    await processRecurringPayments()

    expect(consoleLogSpy).toHaveBeenCalledWith('Recurring Payments job disabled')
  })

  it('console log displays "Recurring Payments job enabled" when env is true', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())

    await processRecurringPayments()

    expect(consoleLogSpy).toHaveBeenCalledWith('Recurring Payments job enabled')
  })

  it('get recurring payments is called when env is true', async () => {
    const date = new Date().toISOString().split('T')[0]

    await processRecurringPayments()

    expect(salesApi.getDueRecurringPayments).toHaveBeenCalledWith(date)
  })

  it('console log displays "Recurring Payments found: " when env is true', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())

    await processRecurringPayments()

    expect(consoleLogSpy).toHaveBeenCalledWith('Recurring Payments found: ', [])
  })

  it('prepares the data for found recurring payments', async () => {
    const referenceNumber = Symbol('reference')
    salesApi.getDueRecurringPayments.mockReturnValueOnce([{ expanded: { activePermission: { entity: { referenceNumber } } } }])

    await processRecurringPayments()

    expect(salesApi.preparePermissionDataForRenewal).toHaveBeenCalledWith(referenceNumber)
  })

  it('creates a transaction with the correct data', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([{ expanded: { activePermission: { entity: { referenceNumber: '1' } } } }])

    const isLicenceForYou = Symbol('isLicenceForYou')
    const isRenewal = Symbol('isRenewal')
    const country = Symbol('country')
    const permitId = Symbol('permitId')
    const firstName = Symbol('firstName')
    const lastName = Symbol('lastName')

    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      isLicenceForYou,
      isRenewal,
      licensee: {
        firstName,
        lastName,
        country,
        countryCode: 'GB-ENG'
      },
      licenceStartDate: '2020-01-01',
      licenceStartTime: 3,
      permitId
    })

    const expectedData = {
      dataSource: 'Recurring Payment',
      permissions: [
        {
          isLicenceForYou,
          isRenewal,
          issueDate: null,
          licensee: {
            firstName,
            lastName,
            country
          },
          permitId,
          startDate: '2020-01-01T03:00:00.000Z'
        }
      ]
    }

    await processRecurringPayments()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(expectedData)
  })

  it('strips the concession name returned by preparePermissionDataForRenewal before passing to createTransaction', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([{ expanded: { activePermission: { entity: { referenceNumber: '1' } } } }])

    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: {
        countryCode: 'GB-ENG'
      },
      concessions: [
        {
          id: 'abc-123',
          name: 'concession-type-1',
          proof: { type: 'NO-PROOF' }
        }
      ]
    })

    await processRecurringPayments()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: expect.arrayContaining([
          expect.objectContaining({
            concessions: expect.arrayContaining([
              expect.not.objectContaining({
                name: 'concession-type-1'
              })
            ])
          })
        ])
      })
    )
  })

  it('assigns the correct startDate when licenceStartTime is present', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([{ expanded: { activePermission: { entity: { referenceNumber: '1' } } } }])

    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: { countryCode: 'GB-ENG' },
      licenceStartDate: '2020-03-14',
      licenceStartTime: 15
    })

    await processRecurringPayments()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [expect.objectContaining({ startDate: '2020-03-14T15:00:00.000Z' })]
      })
    )
  })

  it('assigns the correct startDate when licenceStartTime is not present', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([{ expanded: { activePermission: { entity: { referenceNumber: '1' } } } }])

    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: { countryCode: 'GB-ENG' },
      licenceStartDate: '2020-03-14'
    })

    await processRecurringPayments()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [expect.objectContaining({ startDate: '2020-03-14T00:00:00.000Z' })]
      })
    )
  })

  it('raises an error if createTransaction fails', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([{ expanded: { activePermission: { entity: { referenceNumber: '1' } } } }])
    const error = 'Wuh-oh!'
    salesApi.createTransaction.mockImplementationOnce(() => {
      throw new Error(error)
    })

    await expect(processRecurringPayments()).rejects.toThrowError(error)
  })

  describe.each([2, 3, 10])('if there are %d recurring payments', count => {
    it('prepares the data for each one', async () => {
      const references = []
      for (let i = 0; i < count; i++) {
        references.push(Symbol('reference' + i))
      }

      const mockGetDueRecurringPayments = []
      references.forEach(reference => {
        mockGetDueRecurringPayments.push({ expanded: { activePermission: { entity: { referenceNumber: reference } } } })
      })
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)

      const expectedData = []
      references.forEach(reference => {
        expectedData.push([reference])
      })

      await processRecurringPayments()

      expect(salesApi.preparePermissionDataForRenewal.mock.calls).toEqual(expectedData)
    })

    it('creates a transaction for each one', async () => {
      const mockGetDueRecurringPayments = []
      for (let i = 0; i < count; i++) {
        mockGetDueRecurringPayments.push({ expanded: { activePermission: { entity: { referenceNumber: i } } } })
      }
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)

      const permits = []
      for (let i = 0; i < count; i++) {
        permits.push(Symbol(`permit${i}`))
      }

      permits.forEach(permit => {
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
          licensee: { countryCode: 'GB-ENG' },
          permitId: permit
        })
      })

      const expectedData = []
      permits.forEach(permit => {
        expectedData.push([
          {
            dataSource: 'Recurring Payment',
            permissions: [expect.objectContaining({ permitId: permit })]
          }
        ])
      })

      await processRecurringPayments()

      expect(salesApi.createTransaction.mock.calls).toEqual(expectedData)
    })

    it('logs an error and throws it when sendPayment fails', async () => {
      const transaction = { id: 'transaction-id' }
      const error = new Error('Payment failed')

      salesApi.sendPayment.mockImplementationOnce(() => {
        throw error
      })

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())

      await expect(processPayment(transaction)).rejects.toThrow(error)

      expect(consoleLogSpy).toHaveBeenCalledWith('Error sending payment', JSON.stringify(transaction))
    })
  })
})
