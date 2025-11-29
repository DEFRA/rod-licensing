import pageRoute from '../../../../../routes/page-route.js'
import { LICENCE_NOT_FOUND_RP } from '../../../../../uri.js'
import '../route.js'

jest.mock('../../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../../uri.js', () => ({
  LICENCE_NOT_FOUND_RP: {
    page: Symbol('licence-not-found-rp page'),
    uri: Symbol('licence-not-found-rp uri')
  }
}))

describe('LICENCE_NOT_FOUND_RP route', () => {
  it('passes LICENCE_NOT_FOUND_RP.page as the first argument to pageRoute', () => {
    expect(pageRoute.mock.calls[0][0]).toBe(LICENCE_NOT_FOUND_RP.page)
  })

  it('passes LICENCE_NOT_FOUND_RP.uri as the second argument to pageRoute', () => {
    expect(pageRoute.mock.calls[0][1]).toBe(LICENCE_NOT_FOUND_RP.uri)
  })
})
