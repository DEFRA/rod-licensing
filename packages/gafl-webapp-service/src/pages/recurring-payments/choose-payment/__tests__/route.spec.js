import { validator } from '../route.js'
import { nextPage } from '../../../../routes/next-page.js'
import pageRoute from '../../../../routes/page-route.js'

jest.mock('../../../../routes/page-route.js')

describe('route', () => {
  describe('validator', () => {
    it('validator should validate "yes" as a valid choice', () => {
      const result = validator.validate({ 'recurring-payment': 'yes' })
      expect(result.error).toBeUndefined()
    })

    it('validator should validate "no" as a valid choice', () => {
      const result = validator.validate({ 'recurring-payment': 'no' })
      expect(result.error).toBeUndefined()
    })

    it('validator should not validate an invalid choice', () => {
      const result = validator.validate({ 'recurring-payment': 'invalid' })
      expect(result.error).toBeDefined()
    })

    describe('default', () => {
      it('should call the pageRoute with choose-payment, /buy/choose-payment, validator and nextPage', async () => {
        expect(pageRoute).toBeCalledWith('choose-payment', '/buy/choose-payment', validator, nextPage)
      })
    })
  })
})
