import {
  isMinor,
  isJunior,
  isSenior,
  MINOR_MAX_AGE,
  JUNIOR_MAX_AGE,
  SENIOR_MIN_AGE,
  NEW_SENIOR_MIN_AGE,
  SENIOR_AGE_CHANGE_DATE
} from '../ages.js'
import moment from 'moment'

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
      expect(isSenior(age, moment(SENIOR_AGE_CHANGE_DATE).add(-1, 'day').format('YYYY-MM-DD'))).toBeTruthy()
    })

    it(`age of ${SENIOR_MIN_AGE - 1} is not a senior`, () => {
      expect(isSenior(SENIOR_MIN_AGE - 1, moment(SENIOR_AGE_CHANGE_DATE).add(-1, 'day').format('YYYY-MM-DD'))).toBeFalsy()
    })

    it.each([moment(SENIOR_AGE_CHANGE_DATE).format('YYYY-MM-DD'), moment(SENIOR_AGE_CHANGE_DATE).add(1, 'day').format('YYYY-MM-DD')])(
      `age of ${SENIOR_MIN_AGE} isn't a senior for permissions starting on %s`,
      () => {
        expect(isSenior(SENIOR_MIN_AGE, SENIOR_AGE_CHANGE_DATE)).toBeFalsy()
      }
    )

    it.each([
      moment(SENIOR_AGE_CHANGE_DATE).subtract(1, 'day').format('YYYY-MM-DD'),
      moment(SENIOR_AGE_CHANGE_DATE).subtract(2, 'day').format('YYYY-MM-DD'),
      moment(SENIOR_AGE_CHANGE_DATE).subtract(1, 'week').format('YYYY-MM-DD'),
      moment(SENIOR_AGE_CHANGE_DATE).subtract(1, 'month').format('YYYY-MM-DD')
    ])(`age of ${SENIOR_MIN_AGE} is senior for permissions starting on %s (before SENIOR_AGE_CHANGE_DATE)`, startDate => {
      expect(isSenior(SENIOR_MIN_AGE, startDate)).toBeTruthy()
    })

    it.each`
      age                        | startDate
      ${NEW_SENIOR_MIN_AGE}      | ${moment(SENIOR_AGE_CHANGE_DATE).format('YYYY-MM-DD')}
      ${NEW_SENIOR_MIN_AGE}      | ${moment(SENIOR_AGE_CHANGE_DATE).add(1, 'day').format('YYYY-MM-DD')}
      ${NEW_SENIOR_MIN_AGE}      | ${moment(SENIOR_AGE_CHANGE_DATE).add(1, 'week').format('YYYY-MM-DD')}
      ${NEW_SENIOR_MIN_AGE}      | ${moment(SENIOR_AGE_CHANGE_DATE).add(1, 'month').format('YYYY-MM-DD')}
      ${NEW_SENIOR_MIN_AGE + 1}  | ${moment(SENIOR_AGE_CHANGE_DATE).format('YYYY-MM-DD')}
      ${NEW_SENIOR_MIN_AGE + 5}  | ${moment(SENIOR_AGE_CHANGE_DATE).add(1, 'day').format('YYYY-MM-DD')}
      ${NEW_SENIOR_MIN_AGE + 10} | ${moment(SENIOR_AGE_CHANGE_DATE).add(1, 'week').format('YYYY-MM-DD')}
      ${NEW_SENIOR_MIN_AGE + 15} | ${moment(SENIOR_AGE_CHANGE_DATE).add(1, 'month').format('YYYY-MM-DD')}
    `('age of $age is senior for permissions starting on $startDate (on or after SENIOR_AGE_CHANGE_DATE)', ({ age, startDate }) => {
      expect(isSenior(age, startDate)).toBeTruthy()
    })
  })
})
