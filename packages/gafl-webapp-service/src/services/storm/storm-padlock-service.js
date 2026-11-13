const requestBearerToken = async () => {
  const encodedCredentials = btoa(`${process.env.STORM_PADLOCK_CLIENT_ID}:${process.env.STORM_PADLOCK_CLIENT_SECRET}`)

  try {
    return await fetch(process.env.STORM_PADLOCK_API_TOKEN_URL, {
      method: 'post',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${encodedCredentials}`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
      timeout: process.env.STORM_PADLOCK_API_TIMEOUT_MS
    })
  } catch (err) {
    console.error('Error requesting Bearer token from Storm API', err)
    throw err
  }
}

export const getBearerToken = async () => {
  const response = await requestBearerToken()

  if (response.ok) {
    return response.json().accessToken
  } else {
    const responseData = {
      status: response.status,
      statusText: response.statusText
    }
    throw new Error('Failure retrieving Bearer token from Storm API', responseData)
  }
}
