import { StormPadlockCache } from './storm-padlock-cache'

const STORM_PADLOCK_API_TIMEOUT_MS_DEFAULT = 20000

const requestBearerToken = async () => {
  const encodedCredentials = btoa(`${process.env.STORM_PADLOCK_CLIENT_ID}:${process.env.STORM_PADLOCK_CLIENT_SECRET}`)
  const timeout = Number.parseInt(process.env.STORM_PADLOCK_API_TIMEOUT_MS) || STORM_PADLOCK_API_TIMEOUT_MS_DEFAULT

  try {
    return await fetch(process.env.STORM_PADLOCK_API_TOKEN_URL, {
      method: 'post',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${encodedCredentials}`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(timeout)
    })
  } catch (err) {
    console.error('Error requesting Bearer token from Storm API', err)
    throw err
  }
}

const retrieveAndCacheToken = async cache => {
  let response

  try {
    response = await requestBearerToken()
  } catch (e) {
    await cache.disconnect()
    throw e
  }

  if (response.ok) {
    const token = response.json().accessToken
    const timeout = response.json().expiresIn
    await cache.setCachedToken(token, timeout)
    return token
  } else {
    const responseData = {
      status: response.status,
      statusText: response.statusText
    }
    throw new Error('Failure retrieving Bearer token from Storm API', responseData)
  }
}

export const getBearerToken = async () => {
  const cache = new StormPadlockCache()
  const token = (await cache.getCachedToken()) || (await retrieveAndCacheToken(cache))
  await cache.disconnect()
  return token
}
