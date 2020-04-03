import fetch from 'node-fetch'
import { ADDRESS_LOOKUP_SERVICE } from '../constants.js'
import db from 'debug'
const debug = db('webapp:address-lookup-service')

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

  const { results } = await (async () => {
    try {
      const response = await fetch(url.href, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.json()
    } catch (err) {
      // On a failure to connect do not stop the user journey
      console.error('Unable to connect to address lookup service', err)
      return { results: [] }
    }
  })()

  debug({ results })

  return results.map(r => ({
    address: r.address,
    premises: r.premises,
    street: r.street,
    locality: r.locality,
    town: r.town,
    postcode: r.postcode,
    country: r.country
  }))
}
