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
    gaClientId: previousSessionStatusData?.gaClientId || clientId
  })
}

export const getAffiliation = channel => {
  if (channel === 'telesales') {
    return 'Get a fishing licence service - Telephone sales'
  }
  return 'Get a fishing licence service - Web sales'
}
