import { getData } from '../route.js'
import {
  LICENCE_SUMMARY,
  CONTACT_SUMMARY
} from '../../../uri.js'

const mockProductDetails = [{
  id: 'Salmon 1 Year 5 Rod Licence (Full)',
  name: 'Salmon and sea trout - 5 rod(s) licence',
  brand: 'Rod Fishing Licence',
  category: 'Salmon and sea trout/5 rod(s)/Full',
  variant: '12 Month(s)',
  quantity: 1,
  price: 1
}]
jest.mock('../../../processors/analytics.js', () => ({
  getTrackingProductDetailsFromTransaction: () => mockProductDetails
}))

describe('Analytics for licence summary', () => {
  it('sends ecommerce detail view', async () => {
    const request = getMockRequest()

    await getData(request)

    expect(request.ga.ecommerce.mock.results[0].value.add)
  })
})

const getMockRequest = () => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: () => Promise.resolve({
          [LICENCE_SUMMARY.page]: true,
          [CONTACT_SUMMARY.page]: true
        }),
        setCurrentPermission: () => Promise.resolve()
      },
      transaction: {
        get: () => Promise.resolve(),
        getCurrentPermission: () => Promise.resolve({
          licenceType: '',
          permit: { cost: 0 }
        })
      }
    }
  }),
  ga: {
    ecommerce: jest.fn(() => ({
      add: jest.fn()
    }))
  }
})
