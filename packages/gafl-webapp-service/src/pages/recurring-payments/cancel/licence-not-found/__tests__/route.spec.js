import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_LICENCE_NOT_FOUND } from '../../../../../uri.js'
import '../route.js'

jest.mock('../../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../../uri.js', () => ({
  CANCEL_RP_LICENCE_NOT_FOUND: {
    page: Symbol('cancel-rp-licence-not-found page'),
    uri: Symbol('cancel-rp-licence-not-found uri')
  }
}))

describe('CANCEL_RP_LICENCE_NOT_FOUND route', () => {
  it('passes CANCEL_RP_LICENCE_NOT_FOUND.page as the first argument to pageRoute', () => {
    expect(pageRoute).toHaveBeenCalledWith(CANCEL_RP_LICENCE_NOT_FOUND.page, expect.anything())
  })

  it('passes CANCEL_RP_LICENCE_NOT_FOUND.uri as the second argument to pageRoute', () => {
    expect(pageRoute).toHaveBeenCalledWith(expect.anything(), CANCEL_RP_LICENCE_NOT_FOUND.uri)
  })
})
