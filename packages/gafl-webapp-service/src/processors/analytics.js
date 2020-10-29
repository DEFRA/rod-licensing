import { UTM } from '../constants.js'

export const initialiseAnalyticsSessionData = async (request, previousSessionStatusData) => {
  let clientId
  // When redirecting from the landing page (which uses client side analytics) we need to establish the session identifier using the linker parameter
  if (request.query._ga) {
    clientId = /^.+-(?<clientId>.+)$/.exec(request.query._ga).groups.clientId
  }
  // The user may have an existing session, in which case we need to examine this for attribution and/or clientId
  await request.cache().helpers.status.set({
    gaClientId: previousSessionStatusData?.gaClientId || clientId,
    attribution: previousSessionStatusData?.attribution || {
      [UTM.CAMPAIGN]: request.query[UTM.CAMPAIGN],
      [UTM.MEDIUM]: request.query[UTM.MEDIUM],
      [UTM.CONTENT]: request.query[UTM.CONTENT],
      [UTM.SOURCE]: request.query[UTM.SOURCE],
      [UTM.TERM]: request.query[UTM.TERM]
    }
  })
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
