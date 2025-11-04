import pageRoute from '../../../../../routes/page-route.js'
import { RP_ALREADY_CANCELLED } from '../../../../../uri.js'
import '../route.js'

jest.mock('../../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../../uri.js', () => ({
  RP_ALREADY_CANCELLED: {
    page: Symbol('rp-already-cancelled page'),
    uri: Symbol('rp-already-cancelled uri')
  }
}))

describe('RP_ALREADY_CANCELLED route', () => {
  it('passes RP_ALREADY_CANCELLED.page as the first argument to pageRoute', () => {
    expect(pageRoute.mock.calls[0][0]).toBe(RP_ALREADY_CANCELLED.page)
  })

  it('passes RP_ALREADY_CANCELLED.uri as the second argument to pageRoute', () => {
    expect(pageRoute.mock.calls[0][1]).toBe(RP_ALREADY_CANCELLED.uri)
  })
})
