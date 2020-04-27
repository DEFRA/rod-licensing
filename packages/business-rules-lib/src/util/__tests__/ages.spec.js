import { isMinor, isJunior, isSenior, MINOR_MAX_AGE, JUNIOR_MAX_AGE, SENIOR_MIN_AGE } from '../ages.js'

describe('age determination', () => {
  describe('isMinor', () => {
    it(`allows ages less than or equal to ${MINOR_MAX_AGE}`, async () => {
      expect(isMinor(MINOR_MAX_AGE)).toBeTruthy()
    })
  })
  describe('isJunior', () => {
    it(`allows ages less than or equal to ${JUNIOR_MAX_AGE} but greater than ${MINOR_MAX_AGE}`, async () => {
      expect(isJunior(JUNIOR_MAX_AGE)).toBeTruthy()
      expect(isJunior(MINOR_MAX_AGE + 1)).toBeTruthy()
      expect(isJunior(MINOR_MAX_AGE)).toBeFalsy()
    })
  })

  describe('isSenior', () => {
    it(`allows ages greater than or equal to ${SENIOR_MIN_AGE}`, async () => {
      expect(isSenior(SENIOR_MIN_AGE)).toBeTruthy()
      expect(isSenior(SENIOR_MIN_AGE - 1)).toBeFalsy()
    })
  })
})
