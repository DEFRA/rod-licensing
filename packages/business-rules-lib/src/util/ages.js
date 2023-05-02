/** The maximum age at which an angler is considered to be a minor (free licence) */
export const MINOR_MAX_AGE = 12
/** The maximum age at which an angler is entitled to a junior concession */
export const JUNIOR_MAX_AGE = 16
/** The minimum age at which an angler becomes entitled to a senior concession */
export const SENIOR_MIN_AGE = 66

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
 * @returns {boolean} true if the given age should be classified as a senior
 */
export const isSenior = age => age >= SENIOR_MIN_AGE
