import { HAS_LICENCE, LICENCE_FULFILMENT } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import moment from 'moment-timezone'
import { dateDisplayFormat } from '../../../processors/date-and-time-display.js'

const TWELVE_MONTHS = 12

const licenceTypeDisplay = (permit, mssgs) => {
  const typesStrArr = []

  // Build the display string for the licence type

  if (['S', 'C'].includes(permit.permitSubtype.description)) {
    if (permit.permitSubtype.description === 'C') {
      typesStrArr.push(
        Number(permit.numberOfRods) === 2
          ? mssgs.licence_type_radio_trout_two_rod_payment_summary
          : mssgs.licence_type_radio_trout_three_rod_payment_summary
      )
    } else {
      // must be salmon
      typesStrArr.push(mssgs.licence_type_radio_salmon_payment_summary)
    }
    return typesStrArr.join(' ')
  }
  return ''
}

const endDate = (request, date) => {
  const endMoment = moment.utc(date, null, request.locale)
  const timeComponent = endMoment
    .format('h:mma')
    .replace('12:00am', () => {
      endMoment.subtract(1, 'days')
      return '11:59pm'
    })
    .replace('12:00pm', '12:00pm (midday)')
  return {
    time: timeComponent,
    date: endMoment.format(dateDisplayFormat)
  }
}

export const getData = async request => {
  const mssgs = request.i18n.getCatalog()
  const existingPermissions = await request.cache().helpers.existingPermissions.get()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // filter and sort licences
  const licences = existingPermissions?.permissions?.length
    ? existingPermissions.permissions
      .filter(licence => licence.permit.durationMagnitude === TWELVE_MONTHS)
      .sort((a, b) => {
        if (a.permit.permitSubtype.description === b.permit.permitSubtype.description) {
          return b.permit.numberOfRods - a.permit.numberOfRods
        }
        return a.permit.permitSubtype.description === 'S' ? -1 : 1
      })
      .map(licence => ({
        licenceType: licenceTypeDisplay(licence.permit, mssgs),
        duration: mssgs.licence_type_12m,
        ends: endDate(request, licence.endDate),
        numberOfRods: licence.permit.numberOfRods,
        isSalmon: licence.permit.permitSubtype.description === 'S',
        uri: {}
      }))
    : []

  // if there are no existing permissions, redirect
  if (!licences.length) {
    throw new GetDataRedirect(LICENCE_FULFILMENT.uri)
  }

  return {
    name: `${permission.licensee.firstName} ${permission.licensee.lastName}`,
    isLicenceForYou: permission.isLicenceForYou,
    licences,
    notifySalmon: licences[0].isSalmon
  }
}

export default pageRoute(HAS_LICENCE.page, HAS_LICENCE.uri, null, nextPage, getData)
