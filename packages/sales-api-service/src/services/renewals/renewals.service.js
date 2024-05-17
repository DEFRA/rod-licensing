import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import moment from 'moment-timezone'

// Replicated from GAFL - need to decide whether to move
const cacheDateFormat = 'YYYY-MM-DD'
const licenceToStart = {
  AFTER_PAYMENT: 'after-payment',
  ANOTHER_DATE: 'another-date'
}

export const prepareContactMethodData = existingPermission => {
  const licenseeData = {
    preferredMethodOfNewsletter: existingPermission.licensee.preferredMethodOfNewsletter.label,
    preferredMethodOfConfirmation: existingPermission.licensee.preferredMethodOfConfirmation.label,
    preferredMethodOfReminder: existingPermission.licensee.preferredMethodOfReminder.label
  }

  return licenseeData
}

export const prepareDateData = existingPermission => {
  const endDateMoment = moment.utc(existingPermission.endDate).tz(SERVICE_LOCAL_TIME)
  const renewedHasExpired = !endDateMoment.isAfter(moment().tz(SERVICE_LOCAL_TIME))

  const dateData = renewedHasExpired ? dateDataIfExpired() : dateDataIfNotExpired(renewedHasExpired, endDateMoment)
  dateData.renewedEndDate = endDateMoment.toISOString()

  return dateData
}

const getLicenceStartDate = (renewedHasExpired, licenceEndDate) => {
  if (renewedHasExpired) {
    return moment().tz(SERVICE_LOCAL_TIME)
  }
  return moment(licenceEndDate).add(1, 'minute').seconds(0).tz(SERVICE_LOCAL_TIME)
}

const dateDataIfExpired = () => {
  return {
    renewedHasExpired: true,
    licenceToStart: licenceToStart.AFTER_PAYMENT,
    licenceStartDate: moment().tz(SERVICE_LOCAL_TIME).format(cacheDateFormat),
    licenceStartTime: 0
  }
}

const dateDataIfNotExpired = (renewedHasExpired, endDateMoment) => {
  const licenceStartDate = getLicenceStartDate(renewedHasExpired, endDateMoment)
  return {
    renewedHasExpired: false,
    licenceToStart: licenceToStart.ANOTHER_DATE,
    licenceStartDate: licenceStartDate.format(cacheDateFormat),
    licenceStartTime: licenceStartDate.hours()
  }
}
