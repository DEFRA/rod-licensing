import fetch from 'node-fetch'
import AbortController from 'abort-controller'

import { ADDRESS_LOOKUP_SERVICE, ADDRESS_LOOKUP_MS_DEFAULT } from '../constants.js'
import db from 'debug'
const debug = db('webapp:address-lookup-service')
const controller = new AbortController()
export default async (premises, postcode) => {
  const url = new URL(process.env.ADDRESS_LOOKUP_URL)

  const params = new URLSearchParams({
    postcode: postcode,
    premises: premises,
    key: process.env.ADDRESS_LOOKUP_KEY,
    lang: ADDRESS_LOOKUP_SERVICE.lang,
    dataset: ADDRESS_LOOKUP_SERVICE.dataset
  })

  url.search = params.toString()

  debug({ url })

  const timeout = setTimeout(() => {
    controller.abort()
  }, process.env.ADDRESS_LOOKUP_MS || ADDRESS_LOOKUP_MS_DEFAULT)

  const { results } = await (async () => {
    try {
      const response = await fetch(url.href, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })
      return response.json()
    } catch (err) {
      // On a failure to connect do not stop the user journey
      console.error('Unable to connect to address lookup service', err)
      return { results: [] }
    }
  })()

  clearTimeout(timeout)

  debug({ results })

  // Map and enumerate the results
  return results.map((r, idx) => ({
    id: idx,
    address: r.address,
    premises: r.premises,
    street: r.street_address,
    locality: r.locality,
    town: r.city,
    postcode: r.postcode,
    country: r.country
  }))
}
