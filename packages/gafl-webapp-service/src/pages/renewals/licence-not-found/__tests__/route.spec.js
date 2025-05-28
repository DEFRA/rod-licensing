import pageRoute from '../../../../routes/page-route.js'
import { LICENCE_NOT_FOUND } from '../../../../uri.js'
import '../route.js'

jest.mock('../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../uri.js', () => ({
  RENEWAL_PUBLIC: { uri: Symbol('renewal public uri') },
  LICENCE_NOT_FOUND: {
    page: Symbol('licence-not-found page'),
    uri: Symbol('licence-not-found uri')
  }
}))

describe('LICENCE_NOT_FOUND route', () => {
  it('passes LICENCE_NOT_FOUND.page as the first argument to pageRoute', () => {
    expect(pageRoute.mock.calls[0][0]).toBe(LICENCE_NOT_FOUND.page)
  })

  it('passes LICENCE_NOT_FOUND.uri as the second argument to pageRoute', () => {
    expect(pageRoute.mock.calls[0][1]).toBe(LICENCE_NOT_FOUND.uri)
  })
})
