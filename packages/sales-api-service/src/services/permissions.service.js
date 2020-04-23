import { Permit } from '@defra-fish/dynamics-lib'
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
  const channel = dataSourceOptionSetValue.label.charAt(0)
  const type = permit.permitSubtype.label.charAt(0)

  const durationInDays = moment.duration(`P${permit.durationMagnitude}${permit.durationDesignator.label}`).asDays()
  const duration = String(durationInDays).charAt(0)
  const age = getAgeCategory(birthDate, issueDate)
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  const block2 = permit.numberOfRods + channel + type + duration + age + initials

  const block3 = cryptoRandomString({ length: 6, characters: 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789' })

  return [block1, block2, block3].join('-')
}

export const calculateEndDateMoment = async ({ permitId, startDate }) => {
  const permit = await getReferenceDataForEntityAndId(Permit, permitId)
  const duration = moment.duration(`P${permit.durationMagnitude}${permit.durationDesignator.label}`)
  return moment(startDate).add(duration)
}

export const calculateEndDate = async ({ permitId, startDate }) => (await calculateEndDateMoment({ permitId, startDate })).toISOString()

function getAgeCategory (birthDate, issueDate) {
  const dob = moment(birthDate)
  const issue = moment(issueDate)
  let category = 'F' // Uncategorised

  const diff = issue.diff(dob, 'years', true)
  if (diff <= 16) {
    category = 'J'
  } else if (diff >= 65) {
    category = 'S'
  }
  return category
}
