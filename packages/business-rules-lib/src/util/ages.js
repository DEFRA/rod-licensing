import moment from 'moment'

/** The maximum age at which an angler is considered to be a minor (free licence) */
export const MINOR_MAX_AGE = 12
/** The maximum age at which an angler is entitled to a junior concession */
export const JUNIOR_MAX_AGE = 16
/** The minimum age at which an angler becomes entitled to a senior concession */
export const SENIOR_MIN_AGE = 65
export const NEW_SENIOR_MIN_AGE = 66
export const SENIOR_AGE_CHANGE_DATE = '2023-04-01T00:00:00.000+01:00'
const changeoverMoment = moment(SENIOR_AGE_CHANGE_DATE)

/**
 * Determine if the provided age is classified as a minor
 * @param {number} age The age to be tested
 * @returns {boolean} true if the given age should be classified as a minor
 */
export const isMinor = age => age <= MINOR_MAX_AGE

/**
 * Determine if the provided age is classified as a junior
 * @param {number} age The age to be tested
 * @returns {boolean} true if the given age should be classified as a junior
 */
export const isJunior = age => age > MINOR_MAX_AGE && age <= JUNIOR_MAX_AGE

/**
 * Determine if the provided age is classified as a senior
 * @param {number} age The age to be tested
 * @param {string} permissionStartDate in format YYYY-MM-DD
 * @returns {boolean} true if the given age should be classified as a senior
 */
export const isSenior = (age, permissionStartDate) => {
  const permissionStartsAfterChangeover = changeoverMoment.isSameOrBefore(permissionStartDate)
  return permissionStartsAfterChangeover ? age >= NEW_SENIOR_MIN_AGE : age >= SENIOR_MIN_AGE
}
