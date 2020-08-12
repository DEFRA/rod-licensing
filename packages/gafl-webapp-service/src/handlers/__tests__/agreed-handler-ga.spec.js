import { salesApi } from '@defra-fish/connectors-lib'

import agreedHandler from '../agreed-handler.js'
import { COMPLETION_STATUS } from '../../constants.js'
import { getAffiliation } from '../../processors/analytics'
import { ADULT_FULL_1_DAY_LICENCE } from '../../__mocks__/mock-journeys.js'

const mockProductDetails = [
  {
    id: 'Salmon 1 Year 3 Rod Licence (Full)',
    name: 'Salmon and sea trout - 3 rod(s) licence',
    brand: 'Rod Fishing Licence',
    category: 'Salmon and sea trout/3 rod(s)/Full',
    variant: '12 Month(s)',
    quantity: 1,
    price: 1
  }
]

jest.mock('@defra-fish/connectors-lib')

jest.mock('../../processors/payment.js')
jest.mock('../../services/payment/govuk-pay-service.js', () => ({
  sendPayment: () =>
    Promise.resolve({
      payment_id: 'aaa-111',
      created_date: '2020-08-01T12:51:12.000',
      state: 'what a',
      payment_provider: 'IOU',
      _links: {
        next_url: {
          href: '/exciting/things/here'
        },
        self: {
          href: '/its/full/of/stars'
        }
      }
    }),
  getPaymentStatus: () =>
    Promise.resolve({
      state: {
        finished: true,
        status: 'success'
      }
    })
}))

jest.mock('../../processors/analytics.js', () => ({
  getTrackingProductDetailsFromTransaction: jest.fn(() => mockProductDetails),
  getAffiliation: jest.fn(channel => `Affiliation ${channel}`)
}))

describe('Google Analytics for agreed handler', () => {
  const envChannel = process.env.CHANNEL
  beforeEach(() => {
    delete process.env.CHANNEL
    process.env.CHANNEL = 'websales'
    jest.clearAllMocks()
    salesApi.createTransaction.mockResolvedValue(ADULT_FULL_1_DAY_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(ADULT_FULL_1_DAY_LICENCE.transactionResponse)
  })

  afterAll(() => {
    process.env.CHANNEL = envChannel
  })

  it('sends checkout event with expected data when payment sent', async () => {
    const request = getMockRequest()

    await agreedHandler(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.checkout).toHaveBeenCalledWith(mockProductDetails)
  })

  it('sends purchase event with expected data when payment succeeds', async () => {
    const request = getMockRequest(false)

    await agreedHandler(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.purchase).toHaveBeenCalledWith(
      mockProductDetails,
      expect.any(String),
      expect.any(String)
    )
  })

  it.each(['zzz-999', 'xxx-123', 'thj-598'])('provides transaction identifier for purchase: %s', async samplePaymentId => {
    const request = getMockRequest(false, samplePaymentId)

    await agreedHandler(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.purchase).toHaveBeenCalledWith(expect.any(Array), samplePaymentId, expect.any(String))
  })

  it.each(['telesales', 'websales', 'door-to-door'])('passes channel to be transformed by affiliation', async sampleChannel => {
    process.env.CHANNEL = sampleChannel
    const request = getMockRequest(false)

    await agreedHandler(request, getMockResponseToolkit())

    expect(getAffiliation).toHaveBeenCalledWith(sampleChannel)
  })

  it.each(['telesales', 'websales', 'door-to-door'])('provides affiliation for purchase', async sampleChannel => {
    process.env.CHANNEL = sampleChannel
    const request = getMockRequest(false)

    await agreedHandler(request, getMockResponseToolkit())
    const affiliation = getAffiliation.mock.results[0].value

    expect(request.ga.ecommerce.mock.results[0].value.purchase).toHaveBeenCalledWith(expect.any(Array), expect.any(String), affiliation)
  })
})

const getMockRequest = (checkout = true, payment_id = 'aaa111') => ({
  cache: jest.fn(() => ({
    helpers: {
      status: {
        get: jest.fn(() => ({
          [COMPLETION_STATUS.agreed]: true,
          [COMPLETION_STATUS.posted]: true,
          [COMPLETION_STATUS.paymentCreated]: !checkout
        })),
        set: () => {}
      },
      transaction: {
        get: () => ({
          payment: {
            payment_id
          },
          permissions: [
            {
              permit: {
                description: 'description',
                permitSubtype: {
                  label: 'permitSubtypeLabel'
                },
                numberOfRods: 1,
                permitType: {
                  label: 'permitTypeLabel'
                },
                durationMagnitude: 1,
                durationDesignator: {
                  label: 'durationDesignatorLabel'
                },
                cost: 1,
                concessions: ['a']
              }
            }
          ],
          id: 'fff-111-eee-222',
          cost: 1
        }),
        set: () => {}
      }
    }
  })),
  ga: {
    ecommerce: jest.fn(() => ({
      checkout: jest.fn(),
      purchase: jest.fn()
    }))
  }
})

const getMockResponseToolkit = () => ({
  redirect: () => {}
})
