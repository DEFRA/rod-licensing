import { isMinor, isJunior, isSenior, MINOR_MAX_AGE, JUNIOR_MAX_AGE, SENIOR_MIN_AGE } from '../ages.js'

describe('age determination', () => {
  describe('isMinor', () => {
    it.each(Array.from({ length: MINOR_MAX_AGE }, (_v, index) => index + 1))('age of %d is a minor', age => {
      expect(isMinor(age)).toBeTruthy()
    })
    it(`${MINOR_MAX_AGE + 1} is not a minor`, () => {
      expect(isMinor(MINOR_MAX_AGE + 1)).toBeFalsy()
    })
  })
  describe('isJunior', () => {
    it.each(Array.from({ length: JUNIOR_MAX_AGE - MINOR_MAX_AGE }, (_v, index) => MINOR_MAX_AGE + index + 1))(
      'Age of %d is a Junior',
      age => {
        expect(isJunior(age)).toBeTruthy()
      }
    )
    it.each([MINOR_MAX_AGE, JUNIOR_MAX_AGE + 1])('Age of %d is not a junior', age => {
      expect(isJunior(age)).toBeFalsy()
    })
  })

  describe('isSenior', () => {
    it.each(Array.from({ length: 10 }, (_v, index) => SENIOR_MIN_AGE + index))('age of %d is a senior', age => {
      expect(isSenior(age)).toBeTruthy()
    })

    it(`age of ${SENIOR_MIN_AGE - 1} is not a senior`, () => {
      expect(isSenior(SENIOR_MIN_AGE - 1)).toBeFalsy()
    })
  })
})
