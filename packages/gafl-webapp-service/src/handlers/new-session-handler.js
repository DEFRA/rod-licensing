import { CONTROLLER } from '../uri.js'
import { initialiseAnalyticsSessionData } from '../processors/analytics.js'

export default async (request, h) => {
  // The user may have an existing session, in which case we need to examine this for attribution and/or clientId
  const existingCacheStatus = await request.cache().helpers.status.get()
  await request.cache().initialize()
  await initialiseAnalyticsSessionData(request, existingCacheStatus)
  return h.redirectWithLanguageCode(request, CONTROLLER.uri)
}
