import fetch from 'node-fetch'
import { ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT } from '../../constants.js'
import db from 'debug'
const debug = db('webapp:address-lookup-service')

export default async (premises, postcode) => {
  const url = new URL(process.env.ADDRESS_LOOKUP_URL)

  const params = new URLSearchParams({
    postcode: postcode,
    key: process.env.ADDRESS_LOOKUP_KEY
  })

  url.search = params.toString()

  debug({ url })

  const { results } = await (async () => {
    try {
      const response = await fetch(url.href, {
        headers: { 'Content-Type': 'application/json' },
        timeout: process.env.ADDRESS_LOOKUP_MS || ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT
      })
      return response.json()
    } catch (err) {
      // On a failure to connect do not stop the user journey
      console.error('Unable to connect to address lookup service', err)
      return { results: [] }
    }
  })()

  // Filter results by premises if provided
  const filteredResults = results && premises ? results.filter(r => {
    const normalizedPremises = premises.trim().replace(/\s+/g, ' ').toLowerCase()
    const searchText = [
      r.DPA.SUB_BUILDING_NAME,
      r.DPA.BUILDING_NUMBER,
      r.DPA.BUILDING_NAME,
      r.DPA.ORGANISATION_NAME
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()
    
    return searchText.includes(normalizedPremises)
  }) : results

  debug({ 
    postcode, 
    premises: premises || null,
    receivedCount: results?.length || 0, 
    filteredCount: filteredResults?.length || 0 
  })

  // Map and enumerate the results
  return filteredResults
    ? filteredResults.map((r, idx) => ({
      id: idx,
      address: `${r.DPA.ADDRESS.replace(r.DPA.POSTCODE, '').toLowerCase()}${r.DPA.POSTCODE}`,
      premises: r.DPA.BUILDING_NAME || '',
      street: r.DPA.THOROUGHFARE_NAME || '',
      locality: r.DPA.DEPENDENT_LOCALITY || '',
      town: r.DPA.POST_TOWN || '',
      postcode: r.DPA.POSTCODE,
      country: r.DPA.COUNTRY_CODE_DESCRIPTION || ''
    }))
    : []
}
