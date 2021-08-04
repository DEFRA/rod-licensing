import { mobilePhoneValidator } from '../contact-validator'

describe('contact-validator', () => {
  it.each([
    ['07513438122', '07513438122'],
    ['07513 438167', '07513438167'],
    ['07513 438 167 ', '07513438167'],
    ['+447513 438 167', '+447513438167'],
    ['+44 7513 438 167', '+447513438167'],
    ['07513438168', '07513438168']
  ])('should trim and remove spaces in %s', (mobileNumberi, mobileNumbero) => {
    expect(mobilePhoneValidator.validate(mobileNumberi).value).toBe(mobileNumbero)
  })
})
