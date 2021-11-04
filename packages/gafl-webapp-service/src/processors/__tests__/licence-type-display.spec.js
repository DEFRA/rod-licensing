import { getPronoun } from '../licence-type-display'

describe('licence-type-display', () => {
  describe('getPronoun', () => {
    it('should return your if isLicenceForYou is true', () => {
      expect(getPronoun(true)).toBe('your')
    })
    it('should return their if isLicenceForYou is false', () => {
      expect(getPronoun(false)).toBe('their')
    })
  })
})
