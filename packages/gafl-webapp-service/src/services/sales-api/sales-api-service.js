import fetch from 'node-fetch'
import { SALES_API_URL_DEFAULT, SALES_API_TIMEOUT_MS_DEFAULT } from '../../constants.js'
import countryCodeProcessor from '../../processors/countries-helper.js'

const urlBase = process.env.SALES_API_URL || SALES_API_URL_DEFAULT

const fetchData = async url => {
  let response
  try {
    response = await fetch(url.href, {
      headers: { 'Content-Type': 'application/json' },
      timeout: process.env.SALES_API_TIMEOUT_MS || SALES_API_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error('Unable to fetch data from the sales API service', err)
    throw err
  }

  if (response.ok) {
    return response.json()
  } else {
    const mes = await response.json()
    throw new Error(JSON.stringify(mes, null, 4))
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
    console.error('Error posting data to the sales API service', err)
    throw err
  }

  if (response.ok) {
    return response.json()
  } else {
    const mes = await response.json()
    mes.payload = payload
    throw new Error(JSON.stringify(mes, null, 4))
  }
}

const patchData = async (url, payload) => {
  let response
  try {
    response = await fetch(url.href, {
      method: 'patch',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      timeout: process.env.SALES_API_TIMEOUT_MS || SALES_API_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error('Error patching data to the sales API service', err)
    throw err
  }

  if (response.ok) {
    return response
  } else {
    const mes = {}
    mes.statusText = response
    mes.payload = payload
    throw new Error(JSON.stringify(mes, null, 4))
  }
}

const permitsOperations = {
  fetchPermits: async () => fetchData(new URL('/permits', urlBase)),
  fetchConcessions: async () => fetchData(new URL('/concessions', urlBase)),
  fetchPermitConcessions: async () => fetchData(new URL('/permitConcessions', urlBase))
}

const permissionsOperations = {
  postApiTransactionPayload: async payload => postData(new URL('/transactions', urlBase), payload),
  patchApiTransactionPayload: async (payload, id) => patchData(new URL(`/transactions/${id}`, urlBase), payload)
}

const localReferenceData = {}
const referenceDataOperations = {
  // Cache the countries list locally
  fetchCountriesList: async () => {
    if (!localReferenceData.countriesList) {
      const optionSet = await fetchData(new URL('/option-sets/defra_country', urlBase))
      localReferenceData.countriesList = countryCodeProcessor(optionSet.options)
    }
    return localReferenceData.countriesList
  }
}

export { permitsOperations, permissionsOperations, referenceDataOperations }
