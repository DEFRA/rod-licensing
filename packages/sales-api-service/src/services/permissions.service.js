import { Permission, Permit } from '@defra-fish/dynamics-lib'
import { isJunior, isSenior } from '@defra-fish/business-rules-lib'
import { getGlobalOptionSetValue, getReferenceDataForEntityAndId } from './reference-data.service.js'
import { redis } from './ioredis.service.js'
import moment from 'moment-timezone'

const DICTIONARIES = [
  'ABCDEFGHJKLMNPQRSTUVWXYZ1234567890',
  'BCDFGHJKLM256789',
  'NPQRSTVWXZ256789',
  'BCDFGHJKLM256789',
  'ABCDEFGHJKLMNPQRSTUVWXYZ1234567890'
]

/**
 * Generate a new permission number
 *
 * @param permitId
 * @param issueDate
 * @param startDate
 * @param dataSource
 * @param firstName
 * @param lastName
 * @param birthDate
 * @returns {Promise<string>}
 */
export const generatePermissionNumber = async (
  { permitId, issueDate, startDate, licensee: { firstName, lastName, birthDate } },
  dataSource
) => {
  const permit = await getReferenceDataForEntityAndId(Permit, permitId)

  const endDate = await calculateEndDateMoment({ permitId, startDate })
  const endTime =
    permit.durationMagnitude === 12 && permit.durationDesignator.description === 'M'
      ? moment(endDate)
      : moment(endDate).add(1, 'hour').startOf('hour')
  const block1 = endTime.format('HH') + endDate.format('DDMMYY')

  const dataSourceOptionSetValue = await getGlobalOptionSetValue(Permission.definition.mappings.dataSource.ref, dataSource)
  const channel = dataSourceOptionSetValue.description.charAt(0)
  const type = permit.permitSubtype.description

  const durationInDays = moment.duration(`P${permit.durationMagnitude}${permit.durationDesignator.description}`).asDays()
  const duration = String(durationInDays).charAt(0)
  const age = getAgeCategory(birthDate, issueDate, startDate)
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  const block2 = permit.numberOfRods + channel + type + duration + age + initials

  const seqNo = Number(BigInt.asIntN(32, BigInt(await redis.incr('permission-seq'))))
  const block3 = generate(seqNo, DICTIONARIES)
  const cs = calculateLuhn(`${block1}${block2}${block3}`)
  return `${block1}-${block2}-${block3}${cs}`
}

/**
 * Calculate the end date of a permission for a given permitId and start date
 * @param {string} permitId the permit ID to use when calculating the end date
 * @param {moment.Moment|string} startDate The start date to use when calculating the end date
 * @returns {Promise<moment.Moment>} The end date as a moment
 */
export const calculateEndDateMoment = async ({ permitId, startDate }) => {
  const permit = await getReferenceDataForEntityAndId(Permit, permitId)
  const duration = moment.duration(`P${permit.durationMagnitude}${permit.durationDesignator.description}`)
  if (permit.durationMagnitude === 12 && permit.durationDesignator.description === 'M') {
    return moment(startDate).add(duration).subtract(1, 'day').tz('Europe/London').endOf('day')
  }
  return moment(startDate).add(duration)
}

/**
 * Calculate the end date of a permission for a given permitId and start date
 * @param {string} permitId the permit ID to use when calculating the end date
 * @param {moment.Moment|string} startDate The start date to use when calculating the end date
 * @returns {Promise<string>} The end date as a formatted ISO date string
 */
export const calculateEndDate = async ({ permitId, startDate }) => (await calculateEndDateMoment({ permitId, startDate })).toISOString()

/**
 * Determine the appropriate age category code for use in a permission number
 * @param birthDate The birth date of the licensee
 * @param issueDate The date of issue of the permission
 * @param startDate The start date of the permission
 * @returns {string} The appropriate category code (single digit string)
 */
const getAgeCategory = (birthDate, issueDate, startDate) => {
  const dob = moment(birthDate)
  const issue = moment(issueDate)
  const diff = issue.diff(dob, 'years', true)

  if (isJunior(diff)) {
    return 'J'
  } else if (isSenior(diff, startDate)) {
    return 'S'
  }
  return 'F'
}

/**
 * Generate a new sequence number based on the given sequence number integer and the provided dictionaries.
 * The length of the string returned will be equal to the number of items in the dictionaries array.
 *
 * @param {number} seqNo the sequence number to use.
 * @param {string[]} dictionaries an array of strings providing the allowed characters at each index of the returned sequence
 * @returns {string} the generated sequence number
 */
export const generate = (seqNo, dictionaries) => {
  const buffer = []
  let idx = dictionaries.length - 1

  // Generate the next sequence based on the given number
  do {
    const dict = dictionaries[idx]
    buffer.push(dict[seqNo % dict.length])
    seqNo = Math.floor(seqNo / dict.length)
  } while (seqNo !== 0 && --idx > -1)

  // Pad the string to the required length using the first character of the dictionaries we haven't used
  while (buffer.length < dictionaries.length) {
    buffer.push(dictionaries[dictionaries.length - buffer.length - 1][0])
  }
  return buffer.reverse().join('')
}

/**
 * Calculate a check-digit based on the Luhn mod 10 algorithm
 * @param {string} value the string from which to calculate the check-digit
 * @returns {number} the check-digit value (from 0 to 9)
 */
export const calculateLuhn = value => {
  let factor = 2
  let sum = 0
  for (let i = value.length - 1; i >= 0; i--) {
    const addend = factor * (value[i].charCodeAt(0) - 48)
    factor = factor === 2 ? 1 : 2
    sum += Math.floor(addend / 10) + (addend % 10)
  }
  return (10 - (sum % 10)) % 10
}
