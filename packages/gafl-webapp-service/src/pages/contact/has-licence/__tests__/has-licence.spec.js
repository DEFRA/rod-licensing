import { getData } from '../route.js'
import { nextPage } from '../../../../routes/next-page.js'
import pageRoute from '../../../../routes/page-route.js'

jest.mock('../../../../routes/page-route.js')

const getSampleRequest = (existingPermissions = []) => ({
  cache: () => ({
    helpers: {
      transaction: {
        getExistingPermissions: () => existingPermissions
      }
    }
  })
})

describe('The existing licence page', () => {
  describe('default', () => {
    it('should call the pageRoute with has-licence, /buy/has-licence, null, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('has-licence', '/buy/has-licence', null, nextPage, getData)
    })
  })

  describe('getData', () => {
    it.each([
      [[], 0],
      [['foo'], 1],
      [['foo', 'bar', 'baz'], 3]
    ])('returns expected values', async (existingPermissions, expectedCount) => {
      const result = await getData(getSampleRequest(existingPermissions))

      expect(result).toEqual({
        existingPermissionsCount: expectedCount
      })
    })
  })
})
