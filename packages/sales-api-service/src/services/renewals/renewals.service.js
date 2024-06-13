import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import moment from 'moment-timezone'

// Replicated from GAFL - need to decide whether to move
const cacheDateFormat = 'YYYY-MM-DD'
const licenceToStart = {
  AFTER_PAYMENT: 'after-payment',
  ANOTHER_DATE: 'another-date'
}

export const preparePermissionDataForRenewal = existingPermission => ({
  ...prepareBasePermissionData(existingPermission),
  ...prepareDateData(existingPermission),
  licensee: prepareLicenseeData(existingPermission),
  permitId: preparePermitId(existingPermission)
})

const prepareBasePermissionData = existingPermission => ({
  isRenewal: true,
  licenceLength: '12M', // Always for renewals
  licenceType: existingPermission.permit.permitSubtype.label,
  numberOfRods: existingPermission.permit.numberOfRods.toString(),
  isLicenceForYou: true
})

const prepareLicenseeData = existingPermission => {
  const licenseeData = Object.assign(copyFilteredLicenseeData(existingPermission), prepareCountryData(existingPermission))

  // Delete any licensee objects which are null
  Object.entries(licenseeData)
    .filter(e => e[1] === null)
    .map(e => e[0])
    .forEach(k => delete licenseeData[k])

  Object.assign(licenseeData, prepareContactMethodData(existingPermission))

  return licenseeData
}

const prepareDateData = existingPermission => {
  const endDateMoment = moment.utc(existingPermission.endDate).tz(SERVICE_LOCAL_TIME)
  const renewedHasExpired = !endDateMoment.isAfter(moment().tz(SERVICE_LOCAL_TIME))

  const dateData = renewedHasExpired ? dateDataIfExpired() : dateDataIfNotExpired(endDateMoment)
  dateData.renewedEndDate = endDateMoment.toISOString()

  return dateData
}

// Retain existing data except country and shortTermPreferredMethodOfConfirmation
const copyFilteredLicenseeData = existingPermission =>
  (({ country: _country, shortTermPreferredMethodOfConfirmation: _shortTermPreferredMethodOfConfirmation, ...l }) => l)(
    existingPermission.licensee
  )

const prepareCountryData = existingPermission => ({
  country: existingPermission.licensee.country.label,
  countryCode: existingPermission.licensee.country.description
})

const prepareContactMethodData = existingPermission => ({
  preferredMethodOfNewsletter: existingPermission.licensee.preferredMethodOfNewsletter.label,
  preferredMethodOfConfirmation: existingPermission.licensee.preferredMethodOfConfirmation.label,
  preferredMethodOfReminder: existingPermission.licensee.preferredMethodOfReminder.label
})

const getLicenceStartDate = licenceEndDate => moment(licenceEndDate).add(1, 'minute').seconds(0).tz(SERVICE_LOCAL_TIME)

const dateDataIfExpired = () => ({
  renewedHasExpired: true,
  licenceToStart: licenceToStart.AFTER_PAYMENT,
  licenceStartDate: moment().tz(SERVICE_LOCAL_TIME).format(cacheDateFormat),
  licenceStartTime: 0
})

const dateDataIfNotExpired = endDateMoment => {
  const licenceStartDate = getLicenceStartDate(endDateMoment)
  return {
    renewedHasExpired: false,
    licenceToStart: licenceToStart.ANOTHER_DATE,
    licenceStartDate: licenceStartDate.format(cacheDateFormat),
    licenceStartTime: licenceStartDate.hours()
  }
}

const preparePermitId = existingPermission => existingPermission.permit.id
