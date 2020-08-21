import { salesApi } from '@defra-fish/connectors-lib'
import { prepareApiTransactionPayload, prepareApiFinalisationPayload } from '../api-transaction.js'
import mockPermits from '../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../__mocks__/data/permit-concessions.js'
import mockConcessions from '../../__mocks__/data/concessions.js'
import mockDefraCountries from '../../__mocks__/data/defra-country.js'
import { licenceToStart } from '../../pages/licence-details/licence-to-start/update-transaction.js'

jest.mock('@defra-fish/connectors-lib')
salesApi.permits.getAll.mockResolvedValue(mockPermits)
salesApi.permitConcessions.getAll.mockResolvedValue(mockPermitsConcessions)
salesApi.concessions.getAll.mockResolvedValue(mockConcessions)
salesApi.countries.getAll.mockResolvedValue(mockDefraCountries)

describe('prepareApiTransactionPayload', () => {
  it('prepares when licence is set to start after payment', async () => {
    const fakeRequest = {
      cache: () => ({
        helpers: {
          transaction: {
            get: async () => ({
              permissions: [
                {
                  permit: {
                    id: 'd91b34a0-0c66-e611-80dc-c4346bad0190'
                  },
                  licensee: {
                    birthDate: '2006-01-01',
                    firstName: 'Graham',
                    lastName: 'Willis',
                    premises: '14 Howecroft Court',
                    street: 'Eastmead Lane',
                    town: 'Bristol',
                    postcode: 'BS9 1HJ',
                    countryCode: 'GB',
                    preferredMethodOfNewsletter: 'Prefer not to be contacted',
                    preferredMethodOfConfirmation: 'Prefer not to be contacted',
                    preferredMethodOfReminder: 'Prefer not to be contacted'
                  },
                  licenceToStart: licenceToStart.AFTER_PAYMENT
                }
              ],
              cost: 0
            })
          }
        }
      })
    }

    process.env.CHANNEL = 'telesales'
    await expect(prepareApiTransactionPayload(fakeRequest)).resolves.toEqual({
      dataSource: 'Telesales',
      permissions: [
        {
          permitId: 'd91b34a0-0c66-e611-80dc-c4346bad0190',
          licensee: {
            birthDate: '2006-01-01',
            firstName: 'Graham',
            lastName: 'Willis',
            premises: '14 Howecroft Court',
            street: 'Eastmead Lane',
            town: 'Bristol',
            postcode: 'BS9 1HJ',
            preferredMethodOfNewsletter: 'Prefer not to be contacted',
            preferredMethodOfConfirmation: 'Prefer not to be contacted',
            preferredMethodOfReminder: 'Prefer not to be contacted',
            country: 'United Kingdom'
          },
          issueDate: null,
          startDate: null
        }
      ]
    })
  })
  it('prepares when licence is set to start on a specific date/time', async () => {
    const fakeRequest = {
      cache: () => ({
        helpers: {
          transaction: {
            get: async () => ({
              permissions: [
                {
                  permit: {
                    id: 'd91b34a0-0c66-e611-80dc-c4346bad0190'
                  },
                  licensee: {
                    birthDate: '2006-01-01',
                    firstName: 'Graham',
                    lastName: 'Willis',
                    premises: '14 Howecroft Court',
                    street: 'Eastmead Lane',
                    town: 'Bristol',
                    postcode: 'BS9 1HJ',
                    countryCode: 'GB',
                    preferredMethodOfNewsletter: 'Prefer not to be contacted',
                    preferredMethodOfConfirmation: 'Prefer not to be contacted',
                    preferredMethodOfReminder: 'Prefer not to be contacted'
                  },
                  licenceToStart: licenceToStart.ANOTHER_DATE,
                  licenceStartDate: '2021-01-01',
                  licenceStartTime: 3
                }
              ],
              cost: 0
            })
          }
        }
      })
    }

    delete process.env.CHANNEL
    await expect(prepareApiTransactionPayload(fakeRequest)).resolves.toEqual({
      dataSource: 'Web Sales',
      permissions: [
        {
          permitId: 'd91b34a0-0c66-e611-80dc-c4346bad0190',
          licensee: {
            birthDate: '2006-01-01',
            firstName: 'Graham',
            lastName: 'Willis',
            premises: '14 Howecroft Court',
            street: 'Eastmead Lane',
            town: 'Bristol',
            postcode: 'BS9 1HJ',
            preferredMethodOfNewsletter: 'Prefer not to be contacted',
            preferredMethodOfConfirmation: 'Prefer not to be contacted',
            preferredMethodOfReminder: 'Prefer not to be contacted',
            country: 'United Kingdom'
          },
          issueDate: null,
          startDate: '2021-01-01T03:00:00.000Z'
        }
      ]
    })
  })
})

describe('prepareApiFinalisationPayload', () => {
  it('prepares when licence is set to start after payment', async () => {
    const fakeRequest = {
      cache: () => ({
        helpers: {
          transaction: {
            get: async () => ({
              cost: 5
            })
          }
        }
      })
    }

    await expect(prepareApiFinalisationPayload(fakeRequest)).resolves.toEqual({
      payment: {
        amount: 5,
        method: 'Debit card',
        source: 'Gov Pay',
        timestamp: expect.any(String)
      }
    })
  })
})
