import { UTM } from '../constants.js'
import db from 'debug'
const debug = db('webapp:analytics-processor')

const isDelimitedBy = (id, delimiter) => id.includes(delimiter)

const getClientId = gaId => {
  if (isDelimitedBy(gaId, '.')) {
    const parts = gaId.split('.')
    return [parts[2], parts[3]].join('.')
  }
  if (isDelimitedBy(gaId, '-')) {
    return gaId.split('-').pop()
  }
  return undefined
}

const getClientIdFromGACookie = query => {
  if (query._ga) {
    const clientId = getClientId(query._ga)
    if (!clientId) {
      debug(`Unexpected _ga cookie value: ${query._ga}`)
    }
    return clientId
  }
  return undefined
}

export const initialiseAnalyticsSessionData = async (request, previousSessionStatusData) => {
  // When redirecting from the landing page (which uses client side analytics) we need to establish the session identifier using the linker parameter
  const clientId = getClientIdFromGACookie(request.query)
  await request.cache().helpers.status.set({
    gaClientId: previousSessionStatusData?.gaClientId || clientId,
    attribution: getAttribution(previousSessionStatusData, request)
  })
}

const getAttribution = (sessionData, request) => {
  // The user may have an existing session, in which case we need to examine this for attribution and/or clientId
  if (sessionData) {
    return sessionData.attribution
  } else if (request.query[UTM.CAMPAIGN] && request.query[UTM.SOURCE]) {
    return {
      [UTM.CAMPAIGN]: request.query[UTM.CAMPAIGN],
      [UTM.MEDIUM]: request.query[UTM.MEDIUM],
      [UTM.CONTENT]: request.query[UTM.CONTENT],
      [UTM.SOURCE]: request.query[UTM.SOURCE],
      [UTM.TERM]: request.query[UTM.TERM]
    }
  }
  return undefined
}

export const getTrackingProductDetailsFromTransaction = ({ permissions }) =>
  permissions.map(({ permit }) => ({
    id: permit.description,
    name: `${permit.permitSubtype.label} - ${permit.numberOfRods} rod(s) licence`,
    brand: permit.permitType.label,
    category: [
      permit.permitSubtype.label,
      `${permit.numberOfRods} rod(s)`,
      permit.concessions.length ? permit.concessions.map(c => c.name).join(',') : 'Full'
    ].join('/'),
    variant: `${permit.durationMagnitude} ${permit.durationDesignator.label}`,
    quantity: 1,
    price: permit.cost
  }))

export const getAffiliation = channel => {
  if (channel === 'telesales') {
    return 'Get a fishing licence service - Telephone sales'
  }
  return 'Get a fishing licence service - Web sales'
}
