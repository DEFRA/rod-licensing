import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import {validator} from '../route'

jest.mock('../../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../../routes/page-route.js')

describe('licence-for > route', () => {
  describe('validator', () => {
    it('should return an error if licence-for is not you or someone-else', () => {
      const result = validator.validate({ 'licence-for': 'none' })
      expect(result.error).not.toBeUndefined()
      expect(result.error.details[0].message).toBe('"licence-for" must be one of [you, someone-else]')
    })

    it('should not return an error if licence-for is you', () => {
      const result = validator.validate({ 'licence-for': 'you' })
      expect(result.error).toBeUndefined()
    })

    it('should not return an error if licence-for is someone-else', () => {
      const result = validator.validate({ 'licence-for': 'someone-else' })
      expect(result.error).toBeUndefined()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with licence-for, /buy/licence-for, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('licence-for', '/buy/licence-for', validator, nextPage)
    })
  })
})
