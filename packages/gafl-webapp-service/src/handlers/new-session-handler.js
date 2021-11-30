import { CONTROLLER } from '../uri.js'
import { initialiseAnalyticsSessionData } from '../processors/analytics.js'

export const initialiseSession = async request => {
  // The user may have an existing session, in which case we need to examine this for attribution and/or clientId
  const existingCacheStatus = await request.cache().helpers.status.get()
  await request.cache().initialize()
  await initialiseAnalyticsSessionData(request, existingCacheStatus)
}

export default async (request, h) => {
  await initialiseSession(request)
  return h.redirect(CONTROLLER.uri)
}
