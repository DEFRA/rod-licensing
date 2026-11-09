import { HAS_LICENCE, LICENCE_FULFILMENT } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { dateDisplayFormat } from '../../../processors/date-and-time-display.js'

const licence1 = {
  startDate: new Date().toISOString(),
  endDate: '2025-01-01T00:00:00.000Z',
  permit: {
    permitType: {
      id: 910400000,
      label: 'Rod Fishing Licence',
      description: ''
    },
    permitSubtype: {
      id: 910400001,
      label: 'Salmon and sea trout',
      description: 'S'
    },
    description: 'Coarse 12 month 3 Rod Licence (Senior, Disabled)',
    duration: {
      id: 910400003,
      label: '12 months',
      description: ''
    },
    durationMagnitude: 12,
    numberOfRods: 3,
    isCounterSales: false,
    availableFrom: new Date().toISOString(),
    availableTo: new Date().toISOString()
  }
}

const endDate = (request, date) => {
  const endMoment = moment.utc(date, null, request.locale).tz(SERVICE_LOCAL_TIME)
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

export const getData = async _request => {
  // const existingPermissions = await request.cache().helpers.transaction.getExistingPermissions()
  const existingPermissions = { licences: [licence1] }

  // filter and sort licences
  const licences = existingPermissions?.licences?.length
    ? existingPermissions.licences
      .filter((licence) => licence.permit.durationMagnitude === 12)
      .sort((a, b) => {
        if (a.permit.permitSubtype.description === b.permitSubtype.description) return 0
        return (a.permit.permitSubtype.description === 'S') ? 1 : -1
      }).map( licence => ({ ...licence, end: endDate(_request, licence.permit.endDate)}))
    : []

  // if there are no existing permissions, redirect
  if (!licences.length) {
    throw new GetDataRedirect(LICENCE_FULFILMENT.uri)
  }

  return {
    name: "Michael Myers",
    licences,
    notifySalmon: licences?.[0].permit.permitSubtype.description === 'S'
  }
}

export default pageRoute(HAS_LICENCE.page, HAS_LICENCE.uri, null, nextPage, getData)
