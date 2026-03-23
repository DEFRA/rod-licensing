import fetch from 'node-fetch'
import { ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT, ADDRESS_LOOKUP_MAX_RESULTS_DEFAULT } from '../../constants.js'
import db from 'debug'
const debug = db('webapp:address-lookup-service')

/**
 * Build URL for OS Places API with optional offset
 * @param {string} postcode - The postcode to search
 * @param {number} offset - Optional offset for pagination
 * @returns {string} The complete URL
 */
const buildUrl = (postcode, offset = 0) => {
  const url = new URL(process.env.ADDRESS_LOOKUP_URL)
  const params = new URLSearchParams({
    postcode: postcode,
    key: process.env.ADDRESS_LOOKUP_KEY
  })

  if (offset > 0) {
    params.append('offset', offset)
  }

  url.search = params.toString()
  return url.href
}

/**
 * Fetch a single page from the OS Places API
 * @param {string} url - The URL to fetch
 * @returns {Promise<object>} The API response
 */
const fetchPage = async url => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    timeout: process.env.ADDRESS_LOOKUP_MS || ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT
  })
  return response.json()
}

/**
 * Filter results by premises search term
 * @param {Array} results - Array of address results
 * @param {string} premises - Optional premises search term
 * @returns {Array} Filtered results
 */
const filterByPremises = (results, premises) => {
  if (!results || !premises) return results || []

  const normalizedPremises = premises.trim().replaceAll(/\s+/g, ' ').toLowerCase()

  return results.filter(r => {
    const searchText = [r.DPA.SUB_BUILDING_NAME, r.DPA.BUILDING_NUMBER, r.DPA.BUILDING_NAME, r.DPA.ORGANISATION_NAME]
      .filter(Boolean)
      .join(' ')
      .replaceAll(/\s+/g, ' ')
      .toLowerCase()

    return searchText.includes(normalizedPremises)
  })
}

/**
 * Map API results to application format
 * @param {Array} results - Array of address results
 * @returns {Array} Mapped results
 */
const mapResults = results => {
  return results.map((r, idx) => ({
    id: idx,
    address: `${r.DPA.ADDRESS.replace(r.DPA.POSTCODE, '').toLowerCase()}${r.DPA.POSTCODE}`,
    premises: r.DPA.BUILDING_NAME || '',
    street: r.DPA.THOROUGHFARE_NAME || '',
    locality: r.DPA.DEPENDENT_LOCALITY || '',
    town: r.DPA.POST_TOWN || '',
    postcode: r.DPA.POSTCODE
  }))
}

export default async (premises, postcode) => {
  const startTime = Date.now()
  const cap = parseInt(process.env.ADDRESS_LOOKUP_MAX_RESULTS) || ADDRESS_LOOKUP_MAX_RESULTS_DEFAULT

  // Fetch first page
  const firstUrl = buildUrl(postcode, 0)
  debug({ url: firstUrl })

  const firstPage = await fetchPage(firstUrl).catch(err => {
    // On a failure to connect do not stop the user journey
    console.error('Unable to connect to address lookup service', err)
    return null
  })

  if (!firstPage) return []

  const { totalresults, maxresults } = firstPage.header || {}
  const needsPagination = totalresults && maxresults && totalresults > maxresults

  // Calculate offsets for additional pages
  const effectiveTotal = needsPagination ? Math.min(totalresults, cap) : 0
  const offsets = needsPagination
    ? Array.from({ length: Math.ceil((effectiveTotal - maxresults) / maxresults) }, (_, i) => maxresults + i * maxresults).filter(
      offset => offset < effectiveTotal
    )
    : []

  // Fetch all additional pages in parallel
  const pageResults = offsets.length > 0 ? await Promise.allSettled(offsets.map(offset => fetchPage(buildUrl(postcode, offset)))) : []

  // Extract successful page results
  const additionalResults = pageResults.filter(r => r.status === 'fulfilled' && r.value.results).flatMap(r => r.value.results)

  // Extract failed pages
  const failedPages = pageResults
    .map((result, idx) => ({ result, offset: offsets[idx] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, offset }) => ({
      offset,
      error: result.reason?.message || 'Unknown error'
    }))

  // Aggregate all results
  const allResults = [...(firstPage.results || []), ...additionalResults]
  const pagesFetched = 1 + pageResults.filter(r => r.status === 'fulfilled').length

  // Log partial failures
  if (failedPages.length > 0) {
    console.error(`Failed to fetch ${failedPages.length} pages for postcode ${postcode}`, {
      offsets: failedPages.map(f => f.offset),
      errors: failedPages.map(f => f.error)
    })
  }

  // Log if cap was reached
  if (totalresults > cap) {
    console.warn(
      `Postcode ${postcode}: totalresults ${totalresults} exceeds cap ${cap}, retrieved ${pagesFetched} pages (${allResults.length} addresses)`
    )
  }

  // Filter aggregated results
  const filteredResults = filterByPremises(allResults, premises)

  // Telemetry logging
  const duration = Date.now() - startTime
  debug({
    postcode,
    premises: premises || null,
    totalresults: totalresults || allResults.length,
    maxresults: maxresults || 100,
    pagesFetched,
    aggregatedCount: allResults.length,
    filteredCount: filteredResults.length,
    failedPages: failedPages.length,
    duration: `${duration}ms`
  })

  // Map and return results
  return mapResults(filteredResults)
}
