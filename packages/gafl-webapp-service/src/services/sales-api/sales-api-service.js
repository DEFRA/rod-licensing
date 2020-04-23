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
    console.error('Unable to connect to the sales API service', err)
    throw err
  }
}

const permitsOperations = {
  fetchPermits: async () => fetchData(new URL('/permits', urlBase)),
  fetchConcessions: async () => fetchData(new URL('/concessions', urlBase)),
  fetchPermitConcessions: async () => fetchData(new URL('/permitConcessions', urlBase))
}

export { permitsOperations }
