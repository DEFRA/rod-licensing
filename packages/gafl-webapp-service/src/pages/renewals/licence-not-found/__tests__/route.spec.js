// import route from '../route.js'
import pageRoute from '../../../../routes/page-route.js'
import { LICENCE_NOT_FOUND } from '../../../../uri.js'

jest.mock('../../../../routes/page-route.js', () => jest.fn())

describe('LICENCE_NOT_FOUND route', () => {
  it('should register the route with the correct parameters', () => {
    expect(pageRoute).toHaveBeenCalledWith(LICENCE_NOT_FOUND.page, LICENCE_NOT_FOUND.uri, null)
  })
})
