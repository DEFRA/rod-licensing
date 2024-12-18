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
    const mockRequest = getMockRequest({
      licenceToStart: licenceToStart.AFTER_PAYMENT,
      isRenewal: true,
      isLicenceForYou: true
    })

    process.env.CHANNEL = 'telesales'
    await expect(prepareApiTransactionPayload(mockRequest)).resolves.toEqual({
      dataSource: 'Telesales',
      permissions: [
        getExpectedPermission({
          startDate: null,
          isRenewal: true,
          isLicenceForYou: true
        })
      ]
    })
  })

  it('prepares when licence is set to start on a specific date/time', async () => {
    const mockRequest = getMockRequest({
      licenceToStart: licenceToStart.ANOTHER_DATE,
      licenceStartDate: '2021-01-01',
      licenceStartTime: 3
    })

    delete process.env.CHANNEL
    await expect(prepareApiTransactionPayload(mockRequest)).resolves.toEqual({
      dataSource: 'Web Sales',
      permissions: [getExpectedPermission({ startDate: '2021-01-01T03:00:00.000Z' })]
    })
  })

  it('includes createdBy when state includes OIDC_SESSION_COOKIE_NAME', async () => {
    process.env.OIDC_SESSION_COOKIE_NAME = 'testcookie'
    const mockRequest = getMockRequest(
      {},
      {
        testcookie: { oid: 'oid' }
      }
    )

    await expect(prepareApiTransactionPayload(mockRequest)).resolves.toEqual({
      dataSource: 'Web Sales',
      permissions: [getExpectedPermission({ startDate: null })],
      createdBy: 'oid'
    })
  })

  it('adds transactionId to payload', async () => {
    const transactionId = Symbol('transactionId')

    const payload = await prepareApiTransactionPayload(getMockRequest(), transactionId)

    expect(payload.transactionId).toBe(transactionId)
  })

  it('adds agreementId to payload', async () => {
    const agreementId = Symbol('agreementId')

    const payload = await prepareApiTransactionPayload(getMockRequest(), 'transaction_id', agreementId)

    expect(payload.agreementId).toBe(agreementId)
  })

  const getMockRequest = (overrides = {}, state = {}) => ({
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
                  countryCode: 'GB-ENG',
                  preferredMethodOfNewsletter: 'Prefer not to be contacted',
                  preferredMethodOfConfirmation: 'Prefer not to be contacted',
                  preferredMethodOfReminder: 'Prefer not to be contacted',
                  postalFulfilment: false
                },
                ...overrides
              }
            ],
            cost: 0
          })
        }
      }
    }),
    state
  })

  const getExpectedPermission = (overrides = {}) => ({
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
      postalFulfilment: false,
      country: 'England'
    },
    issueDate: null,
    ...overrides
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
