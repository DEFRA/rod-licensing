import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_ALREADY_CANCELLED } from '../../../../../uri.js'
import '../route.js'

jest.mock('../../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../../uri.js', () => ({
  CANCEL_RP_ALREADY_CANCELLED: {
    page: Symbol('cancel-rp-already-cancelled page'),
    uri: Symbol('already-cancelled uri')
  }
}))

describe('CANCEL_RP_ALREADY_CANCELLED route', () => {
  it('passes CANCEL_RP_ALREADY_CANCELLED.page as the first argument to pageRoute', () => {
    expect(pageRoute.mock.calls[0][0]).toBe(CANCEL_RP_ALREADY_CANCELLED.page)
  })

  it('passes CANCEL_RP_ALREADY_CANCELLED.uri as the second argument to pageRoute', () => {
    expect(pageRoute.mock.calls[0][1]).toBe(CANCEL_RP_ALREADY_CANCELLED.uri)
  })
})
