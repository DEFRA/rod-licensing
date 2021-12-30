import { getData, validator } from '../route'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'

jest.mock('../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../routes/page-route.js')

describe('terms-and-conditions > route', () => {
  describe('default', () => {
    it('should call the pageRoute with terms-and-conditions, /buy/conditions, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('terms-and-conditions', '/buy/conditions', validator, nextPage, getData)
    })
  })
})
