import fetch from 'node-fetch'
import { ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT, ADDRESS_LOOKUP_MAX_RESULTS_DEFAULT } from '../../constants.js'
import db from 'debug'
const debug = db('webapp:address-lookup-service')

/**
 * Build URL for OS Places API with optional offset
 * @param {string} postcode - The postcode to search
 * @param {number} offset - Offset for pagination
 * @returns {string} The complete URL
 */
const buildUrl = (postcode, offset) => {
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
  if (!results || !premises) {
    return results || []
  }

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

/**
 * Fetch additional pages when pagination is needed
 * @param {string} postcode - The postcode being searched
 * @param {number} totalresults - Total results available from API
 * @param {number} maxresults - Maximum results per page
 * @param {number} cap - Maximum results to fetch (configurable limit)
 * @returns {Promise<object>} Object containing additional results, failed pages, and page count
 */
const fetchAdditionalPages = async (postcode, totalresults, maxresults, cap) => {
  const effectiveTotal = Math.min(totalresults, cap)

  // Calculate offsets for additional pages (first page already fetched at offset 0)
  // Example: if effectiveTotal=250 and maxresults=100, generates [100, 200] to fetch pages 2 and 3
  const offsets = Array.from(
    { length: Math.ceil((effectiveTotal - maxresults) / maxresults) },
    (_, i) => maxresults + i * maxresults
  ).filter(offset => offset < effectiveTotal)

  if (offsets.length === 0) {
    return { results: [], failedPages: [], pagesFetched: 0 }
  }

  const pageResults = await Promise.allSettled(offsets.map(offset => fetchPage(buildUrl(postcode, offset))))

  const additionalResults = pageResults.filter(r => r.status === 'fulfilled' && r.value.results).flatMap(r => r.value.results)

  const failedPages = pageResults
    .map((result, idx) => ({ result, offset: offsets[idx] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, offset }) => ({
      offset,
      error: result.reason?.message || 'Unknown error'
    }))

  const pagesFetched = pageResults.filter(r => r.status === 'fulfilled').length

  return { results: additionalResults, failedPages, pagesFetched }
}

/**
 * Get the maximum results cap from environment or default
 * @returns {number} Maximum results cap
 */
const getMaximumResultsCap = () => {
  return Number.parseInt(process.env.ADDRESS_LOOKUP_MAX_RESULTS) || ADDRESS_LOOKUP_MAX_RESULTS_DEFAULT
}

/**
 * Check if pagination is needed based on total results and page size
 * @param {number} totalresults - Total results available
 * @param {number} maxresults - Maximum results per page
 * @returns {boolean} Whether pagination is needed
 */
const checkNeedsPagination = (totalresults, maxresults) => {
  return totalresults && maxresults && totalresults > maxresults
}

/**
 * Fetch the first page of results
 * @param {string} postcode - The postcode to search
 * @returns {Promise<object|null>} First page response or null on error
 */
const fetchFirstPage = async postcode => {
  const firstUrl = buildUrl(postcode, 0)
  debug({ url: firstUrl })

  const firstPage = await fetchPage(firstUrl).catch(err => {
    // On a failure to connect do not stop the user journey
    console.error('Unable to connect to address lookup service', err)
    return null
  })

  return firstPage
}

/**
 * Process and aggregate results from multiple pages
 * @param {object} firstPage - First page response
 * @param {Array} additionalResults - Results from additional pages
 * @param {Array} failedPages - Failed page information
 * @param {number} additionalPagesFetched - Count of additional pages fetched
 * @param {string} postcode - Postcode being searched
 * @param {number} cap - Maximum results cap
 * @param {number} startTime - Start timestamp for telemetry
 * @returns {Array} Aggregated results
 */
const processResults = (firstPage, additionalResults, failedPages, additionalPagesFetched, postcode, cap, startTime) => {
  const allResults = [...(firstPage.results || []), ...additionalResults]
  const pagesFetched = 1 + additionalPagesFetched
  const { totalresults, maxresults } = firstPage.header || {}

  if (failedPages.length > 0) {
    console.error(`Failed to fetch ${failedPages.length} pages for postcode ${postcode}`, {
      offsets: failedPages.map(f => f.offset),
      errors: failedPages.map(f => f.error)
    })
  }

  if (totalresults > cap) {
    console.warn(
      `Postcode ${postcode}: totalresults ${totalresults} exceeds cap ${cap}, retrieved ${pagesFetched} pages (${allResults.length} addresses)`
    )
  }

  const duration = Date.now() - startTime
  debug({
    postcode,
    totalresults: totalresults || allResults.length,
    maxresults: maxresults || 100,
    pagesFetched,
    aggregatedCount: allResults.length,
    failedPages: failedPages.length,
    duration: `${duration}ms`
  })

  return allResults
}

export default async (premises, postcode) => {
  const startTime = Date.now()

  const firstPage = await fetchFirstPage(postcode)

  if (!firstPage) {
    return []
  }

  const { totalresults, maxresults } = firstPage.header || {}
  const needsPagination = checkNeedsPagination(totalresults, maxresults)

  // Fetch additional pages if needed
  const cap = getMaximumResultsCap()
  const {
    results: additionalResults,
    failedPages,
    pagesFetched: additionalPagesFetched
  } = needsPagination
    ? await fetchAdditionalPages(postcode, totalresults, maxresults, cap)
    : { results: [], failedPages: [], pagesFetched: 0 }

  const allResults = processResults(firstPage, additionalResults, failedPages, additionalPagesFetched, postcode, cap, startTime)
  const filteredResults = filterByPremises(allResults, premises)

  debug({ premises: premises || null, filteredCount: filteredResults.length })

  return mapResults(filteredResults)
}
