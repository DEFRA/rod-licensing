import { Permit } from '@defra-fish/dynamics-lib'
import { isJunior, isSenior } from '@defra-fish/business-rules-lib'
import { getGlobalOptionSetValue, getReferenceDataForEntityAndId } from './reference-data.service.js'
import moment from 'moment'
import cryptoRandomString from 'crypto-random-string'

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
  const endTime = moment(endDate)
    .add(1, 'hour')
    .startOf('hour')
  const block1 = endTime.format('HH') + endDate.format('DDMMYY')

  const dataSourceOptionSetValue = await getGlobalOptionSetValue('defra_datasource', dataSource)
  const channel = dataSourceOptionSetValue.description.charAt(0)
  const type = permit.permitSubtype.description

  const durationInDays = moment.duration(`P${permit.durationMagnitude}${permit.durationDesignator.description}`).asDays()
  const duration = String(durationInDays).charAt(0)
  const age = getAgeCategory(birthDate, issueDate)
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  const block2 = permit.numberOfRods + channel + type + duration + age + initials

  const block3 = cryptoRandomString({ length: 6, characters: 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789' })

  return [block1, block2, block3].join('-')
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
 * @returns {string} The appropriate category code (single digit string)
 */
function getAgeCategory (birthDate, issueDate) {
  const dob = moment(birthDate)
  const issue = moment(issueDate)
  let category = 'F' // Uncategorised

  const diff = issue.diff(dob, 'years', true)
  if (isJunior(diff)) {
    category = 'J'
  } else if (isSenior(diff)) {
    category = 'S'
  }
  return category
}
