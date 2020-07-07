import pageHandler from '../page-handler.js'
import {
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  TERMS_AND_CONDITIONS
} from '../../uri.js'

const mockProductDetails = [{
  id: 'Salmon 1 Year 5 Rod Licence (Full)',
  name: 'Salmon and sea trout - 5 rod(s) licence',
  brand: 'Rod Fishing Licence',
  category: 'Salmon and sea trout/5 rod(s)/Full',
  variant: '12 Month(s)',
  quantity: 1,
  price: 1
}]
jest.mock('../../uri.js', () => ({
  CONTACT_SUMMARY: { uri: '/path/to/contact/summary' },
  LICENCE_SUMMARY: { uri: '/path/to/licence/summary' },
  TERMS_AND_CONDITIONS: { uri: '/path/to/terms/and/conditions' },
  CONTROLLER: { uri: '/path/to/controller' }
}))
jest.mock('../../processors/analytics.js', () => ({
  getTrackingProductDetailsFromTransaction: () => mockProductDetails
}))

describe('Google analytics tracking', () => {
  it(`sends ecommerce detail view on ${CONTACT_SUMMARY.uri}`, async () => {
    const request = getMockRequest()

    await pageHandler(CONTACT_SUMMARY.uri).get(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.detail).toHaveBeenCalledWith(mockProductDetails)
  })

  it(`sends ecommerce detail view on ${LICENCE_SUMMARY.uri}`, async () => {
    const request = getMockRequest()

    await pageHandler(LICENCE_SUMMARY.uri).get(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.detail).toHaveBeenCalledWith(mockProductDetails)
  })

  it(`sends ecommerce add on ${TERMS_AND_CONDITIONS.uri}`, async () => {
    const request = getMockRequest()

    await pageHandler(TERMS_AND_CONDITIONS.uri).get(request, getMockResponseToolkit())

    expect(request.ga.ecommerce.mock.results[0].value.add).toHaveBeenCalledWith(mockProductDetails)
  })

  it.each([
    '/buy/any',
    '/buy/other',
    '/buy/uri'
  ])('doesn\'t send ecommerce events for other URIs', async (uri) => {
    const request = getMockRequest()
    await pageHandler(uri).get(request, getMockResponseToolkit())
    expect(request.ga.ecommerce).not.toHaveBeenCalled()
  })
})

const getMockRequest = () => ({
  cache: jest.fn(() => ({
    helpers: {
      page: {
        getCurrentPermission: () => Promise.resolve({})
      },
      status: {
        getCurrentPermission: () => Promise.resolve({}),
        setCurrentPermission: () => Promise.resolve()
      },
      transaction: {
        get: () => ({
          payment: {
            payment_id: 'aaa111'
          },
          permissions: {
            permit: {
              description: 'permitDescription',
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
          },
          id: 'fff-111-eee-222',
          cost: 1
        }),
        set: () => {}
      }
    }
  })),
  ga: {
    ecommerce: jest.fn(() => ({
      detail: jest.fn(),
      add: jest.fn()
    }))
  }
})

const getMockResponseToolkit = () => ({
  redirect: () => {},
  view: () => {}
})
