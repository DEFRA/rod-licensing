import { validator } from '../route'

describe('licence-for > route', () => {
  describe('validator', () => {
    it('should return an error if licence-for is not you or someone-else', () => {
      const result = validator.validate({'licence-for': 'none'})
      expect(result.error).not.toBeUndefined()
      expect(result.error.details[0].message).toBe('"licence-for" must be one of [you, someone-else]')
    })

    it('should not return an error if licence-for is you', () => {
      const result = validator.validate({'licence-for': 'you'})
      expect(result.error).toBeUndefined()
    })

    it('should not return an error if licence-for is someone-else', () => {
      const result = validator.validate({'licence-for': 'someone-else'})
      expect(result.error).toBeUndefined()
    })
  })
})