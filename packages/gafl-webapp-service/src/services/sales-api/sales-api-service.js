import fetch from 'node-fetch'
import { SALES_API_URL_DEFAULT, SALES_API_TIMEOUT_MS_DEFAULT } from '../../constants.js'

const urlBase = process.env.SALES_API_URL || SALES_API_URL_DEFAULT

const fetchData = async url => {
  try {
    const response = await fetch(url.href, {
      headers: { 'Content-Type': 'application/json' },
      timeout: process.env.SALES_API_TIMEOUT_MS || SALES_API_TIMEOUT_MS_DEFAULT
    })
    return response.json()
  } catch (err) {
    console.error('Unable to fetch to the sales API service', err)
    throw err
  }
}

const postData = async (url, payload) => {
  let response
  try {
    response = await fetch(url.href, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      timeout: process.env.SALES_API_TIMEOUT_MS || SALES_API_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error('Error on post to the sales API service', err)
    throw err
  }

  if (response.ok) {
    return response.json()
  } else {
    throw new Error(`${response.statusText}\n Sale API post error - payload: \n${JSON.stringify(payload)}`)
  }
}

const permitsOperations = {
  fetchPermits: async () => fetchData(new URL('/permits', urlBase)),
  fetchConcessions: async () => fetchData(new URL('/concessions', urlBase)),
  fetchPermitConcessions: async () => fetchData(new URL('/permitConcessions', urlBase))
}

const permissionsOperations = {
  postApiTransactionPayload: async payload => postData(new URL('/transactions', urlBase), payload)
}

export { permitsOperations, permissionsOperations }
