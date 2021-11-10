import { getPronoun } from '../licence-type-display'

describe('licence-type-display', () => {
  describe('getPronoun', () => {
    it('should return your and you, if isLicenceForYou is true', () => {
      expect(getPronoun(true)).toStrictEqual({ possessive: 'your', personal: 'you' })
    })
    it('should return their and they, if isLicenceForYou is false', () => {
      expect(getPronoun(false)).toStrictEqual({ possessive: 'their', personal: 'they' })
    })
  })
})
