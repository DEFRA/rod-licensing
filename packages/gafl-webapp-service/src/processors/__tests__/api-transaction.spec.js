import { salesApi } from '@defra-fish/connectors-lib'
import { prepareApiTransactionPayload, prepareApiFinalisationPayload } from '../api-transaction.js'
import mockPermits from '../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../__mocks__/data/permit-concessions.js'
import mockConcessions from '../../__mocks__/data/concessions.js'
import mockDefraCountries from '../../__mocks__/data/defra-country.js'
import { licenceToStart } from '../../pages/licence-details/licence-to-start/update-transaction.js'
import * as concessionHelper from '../concession-helper.js'
import { CONCESSION, CONCESSION_PROOF } from '../mapping-constants.js'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    permits: {
      getAll: jest.fn()
    },
    permitConcessions: {
      getAll: jest.fn()
    },
    concessions: {
      getAll: jest.fn()
    },
    countries: {
      getAll: jest.fn()
    }
  }
}))
jest.mock('../concession-helper.js')

beforeEach(() => {
  salesApi.permits.getAll.mockResolvedValue(mockPermits)
  salesApi.permitConcessions.getAll.mockResolvedValue(mockPermitsConcessions)
  salesApi.concessions.getAll.mockResolvedValue(mockConcessions)
  salesApi.countries.getAll.mockResolvedValue(mockDefraCountries)

  concessionHelper.hasDisabled.mockReturnValue(false)
  concessionHelper.hasSenior.mockReturnValue(false)
  concessionHelper.hasJunior.mockReturnValue(false)
})

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

    expect(payload.recurringPayment.agreementId).toBe(agreementId)
  })

  it.each([
    [
      'disabled',
      'hasDisabled',
      'd1ece997-ef65-e611-80dc-c4346bad4004',
      {
        concessions: [
          {
            type: CONCESSION.DISABLED,
            proof: { type: CONCESSION_PROOF.blueBadge, referenceNumber: 'BB123456' }
          }
        ]
      },
      { type: CONCESSION_PROOF.blueBadge, referenceNumber: 'BB123456' }
    ],
    ['senior', 'hasSenior', 'd0ece997-ef65-e611-80dc-c4346bad4004', {}, { type: CONCESSION_PROOF.none }],
    ['junior', 'hasJunior', '3230c68f-ef65-e611-80dc-c4346bad4004', {}, { type: CONCESSION_PROOF.none }]
  ])(
    'adds %s concession when permission has %s concession',
    async (concessionType, helperMethod, expectedId, requestOverrides, expectedProof) => {
      concessionHelper[helperMethod].mockReturnValue(true)

      const mockRequest = getMockRequest(requestOverrides)
      const payload = await prepareApiTransactionPayload(mockRequest)

      expect(payload.permissions[0].concessions).toEqual([
        {
          id: expectedId,
          proof: expectedProof
        }
      ])
    }
  )

  it.each([
    [
      'disabled over senior',
      ['hasDisabled', 'hasSenior'],
      'd1ece997-ef65-e611-80dc-c4346bad4004',
      {
        concessions: [{ type: CONCESSION.DISABLED, proof: { type: CONCESSION_PROOF.NI, referenceNumber: 'NI123' } }]
      }
    ],
    [
      'disabled over junior',
      ['hasDisabled', 'hasJunior'],
      'd1ece997-ef65-e611-80dc-c4346bad4004',
      {
        concessions: [{ type: CONCESSION.DISABLED, proof: { type: CONCESSION_PROOF.blueBadge } }]
      }
    ],
    ['senior over junior', ['hasSenior', 'hasJunior'], 'd0ece997-ef65-e611-80dc-c4346bad4004', {}]
  ])('prioritizes %s when both apply', async (description, helperMethods, expectedId, requestOverrides) => {
    helperMethods.forEach(method => concessionHelper[method].mockReturnValue(true))

    const mockRequest = getMockRequest(requestOverrides)
    const payload = await prepareApiTransactionPayload(mockRequest)

    expect(payload.permissions[0].concessions).toHaveLength(1)
    expect(payload.permissions[0].concessions[0].id).toBe(expectedId)
  })

  it('does not add concessions when none apply', async () => {
    const mockRequest = getMockRequest()
    const payload = await prepareApiTransactionPayload(mockRequest)

    expect(payload.permissions[0].concessions).toBeUndefined()
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
