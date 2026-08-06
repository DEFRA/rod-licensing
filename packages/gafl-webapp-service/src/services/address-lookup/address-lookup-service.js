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
    lr: 'EN',
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

const buildPremises = result => {
  if (shouldBeOrganisationOnly(result)) {
    return result.ORGANISATION_NAME
  }

  const premisesFields = []
  if (isPoBoxAddress(result)) {
    premisesFields.push('PO BOX ' + result.PO_BOX_NUMBER)
  } else {
    premisesFields.push(result.PO_BOX_NUMBER)
  }
  premisesFields.push(result.SUB_BUILDING_NAME, result.BUILDING_NAME, result.BUILDING_NUMBER)

  return removeMissingOrBlankFields(premisesFields).join(', ')
}

const buildStreet = result => {
  const streetFields = [result.DEPENDENT_THOROUGHFARE_NAME, result.THOROUGHFARE_NAME]

  return removeMissingOrBlankFields(streetFields).join(', ')
}

const buildLocality = result => {
  const localityFields = [result.DOUBLE_DEPENDENT_LOCALITY, result.DEPENDENT_LOCALITY]

  return removeMissingOrBlankFields(localityFields).join(', ')
}

const shouldBeOrganisationOnly = result => {
  const fieldsToCheck = [result.PO_BOX_NUMBER, result.SUB_BUILDING_NAME, result.BUILDING_NAME, result.BUILDING_NUMBER]
  const noAlternativeFields = removeMissingOrBlankFields(fieldsToCheck).length === 0
  const organisationNamePresent = removeMissingOrBlankFields([result.ORGANISATION_NAME])
  return noAlternativeFields && organisationNamePresent
}

const isPoBoxAddress = result => result.CLASSIFICATION_CODE === 'OR3' && result.PO_BOX_NUMBER

const removeMissingOrBlankFields = array => array.map(e => removeTrailingWhitespace(e)).filter(e => isNotNullOrUndefinedOrEmpty(e))
const removeTrailingWhitespace = value => (typeof value === 'string' ? value.trim() : value)
const isNotNullOrUndefinedOrEmpty = value => value !== null && value !== undefined && String(value).length

/**
 * Filter results by premises search term and order results
 * @param {Array} results - Array of address results
 * @param {string} premises - Optional premises search term
 * @returns {Array} Filtered results
 */
const filterAndOrderResults = (results, premises) => {
  if (!premises) {
    return results
  }

  const userProvidedSearchTerms = splitStringIntoSearchTerms(premises)
  const matches = []

  for (const result of results) {
    const resultPremises = buildPremises(result.DPA)
    const resultTerms = splitStringIntoSearchTerms(resultPremises)
    let matchRating = 0

    for (const userProvidedSearchTerm of userProvidedSearchTerms) {
      for (const resultTerm of resultTerms) {
        matchRating = matchRating + checkQualityOfMatch(userProvidedSearchTerm, resultTerm)
      }
    }

    if (matchRating > 0) {
      matches.push({ matchRating, result })
    }
  }

  // Order with highest-rated matches first
  const orderedMatches = matches.toSorted((a, b) => b.matchRating - a.matchRating)
  // Drop the scores and return the ordered results only
  return orderedMatches.map(r => r.result)
}

const splitStringIntoSearchTerms = string => {
  // Lowercase, strip out parentheses, then split on spaces, hyphens, full stops and commas
  const terms = string
    .toLowerCase()
    .replaceAll(/[()]/g, '')
    .split(/\s+|-|\.|,/)
  const termsExcludingThe = terms.filter(term => term !== 'the')
  return removeMissingOrBlankFields(termsExcludingThe)
}

const checkQualityOfMatch = (userProvidedSearchTerm, resultTerm) => {
  if (userProvidedSearchTerm === resultTerm) {
    // Matches that contain both letters and digits score higher
    if (/^(?=.*[a-zA-Z])(?=.*\d)/.test(userProvidedSearchTerm)) {
      return 2
    }
    return 1
  }

  return 0
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
    premises: buildPremises(r.DPA),
    street: buildStreet(r.DPA) || '',
    locality: buildLocality(r.DPA) || '',
    town: r.DPA.POST_TOWN || '',
    postcode: r.DPA.POSTCODE
  }))
}

/**
 * Calculate offsets for additional pages (first page already fetched at offset 0)
 * Example: if effectiveTotal=250 and maxResults=100, generates [100, 200] to fetch pages 2 and 3
 * @param {number} cap - Maximum results to fetch (configurable limit)
 * @param {number} maxResults - Maximum results per page
 * @param {number} totalResults - Total results available from API
 * @returns {array} Array of numbers for the result at the "start" of each page
 */
const calculateOffsets = (cap, maxResults, totalResults) => {
  const effectiveTotal = Math.min(totalResults, cap)

  return Array.from({ length: Math.ceil((effectiveTotal - maxResults) / maxResults) }, (_, i) => maxResults + i * maxResults).filter(
    offset => offset < effectiveTotal
  )
}

/**
 * Fetch additional pages when pagination is needed
 * @param {string} postcode - The postcode being searched
 * @param {number} totalResults - Total results available from API
 * @param {number} maxResults - Maximum results per page
 * @param {number} cap - Maximum results to fetch (configurable limit)
 * @returns {Promise<object>} Object containing additional results, failed pages, and page count
 */
const fetchAdditionalPages = async (postcode, totalResults, maxResults, cap) => {
  const offsets = calculateOffsets(cap, maxResults, totalResults)

  if (offsets.length === 0) {
    return { additionalResults: [], failedPages: [], additionalPagesFetched: 0 }
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

  return { additionalResults, failedPages, pagesFetched }
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
 * @param {number} totalResults - Total results available
 * @param {number} maxResults - Maximum results per page
 * @returns {boolean} Whether pagination is needed
 */
const paginationRequired = (totalResults, maxResults) => {
  return totalResults && maxResults && totalResults > maxResults
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
 * Fetch additional pages when pagination is needed
 * @param {number} totalResults - Total results available from API
 * @param {number} maxResults - Maximum results per page
 * @param {string} postcode - Postcode being searched
 * @param {number} cap - Maximum results to fetch (configurable limit)
 * @returns {Promise<object>} Object containing additional results, failed pages, and page count
 */
const fetchAdditionalPagesIfNecessary = async ({ totalResults, maxResults, postcode, cap }) => {
  const needsPagination = paginationRequired(totalResults, maxResults)

  if (needsPagination) {
    const { additionalResults, failedPages, additionalPagesFetched } = await fetchAdditionalPages(postcode, totalResults, maxResults, cap)
    return { additionalResults, failedPages, additionalPagesFetched }
  } else {
    return { additionalResults: [], failedPages: [], additionalPagesFetched: 0 }
  }
}

/**
 * Combine results from multiple pages into one array
 * @param {object} firstPage - First page response
 * @param {array} additionalResults - Results from subsequent pages
 * @returns {Array} Combined results from the first page and any subsequent pages
 */
const combineFirstAndAdditionalResults = (firstPage, additionalResults) => {
  const firstPageResults = firstPage.results || []
  return [...firstPageResults, ...additionalResults]
}

/**
 * Log an error if any pages failed
 * @param {array} failedPages - Pages that failed
 * @param {string} postcode - The postcode being searched
 */
const checkForFailedPages = ({ failedPages, postcode }) => {
  if (failedPages.length > 0) {
    console.error(`Failed to fetch ${failedPages.length} pages for postcode ${postcode}`, {
      offsets: failedPages.map(f => f.offset),
      errors: failedPages.map(f => f.error)
    })
  }
}

/**
 * Log a warning if there are more matches than can be requested
 * @param {number} cap - Maximum results to fetch (configurable limit)
 * @param {number} pagesFetched - Total count of pages fetched
 * @param {string} postcode - The postcode being searched
 * @param {number} resultsLength - Length of the allResults array
 * @param {number} totalResults - Total results available from API
 */
const checkIfCapExceeded = ({ cap, pagesFetched, postcode, resultsLength, totalResults }) => {
  if (totalResults > cap) {
    console.warn(
      `Postcode ${postcode}: totalresults ${totalResults} exceeds cap ${cap}, retrieved ${pagesFetched} pages (${resultsLength} addresses)`
    )
  }
}

/**
 * Log debug data about the result of the OS Places requests
 * @param {number} startTime - Start timestamp for telemetry
 * @param {array} failedPages - Pages that failed
 * @param {number} maxresults - Maximum results per page
 * @param {number} pagesFetched - Total count of pages fetched
 * @param {string} postcode - The postcode being searched
 * @param {number} resultsLength - Length of the allResults array
 * @param {number} totalResults - Total results available from API
 */
const logDebugData = (startTime, { failedPages, maxResults, pagesFetched, postcode, resultsLength, totalResults }) => {
  const duration = Date.now() - startTime
  debug({
    postcode,
    totalResults: totalResults || resultsLength,
    maxResults: maxResults || 100,
    pagesFetched,
    aggregatedCount: resultsLength,
    failedPages: failedPages.length,
    duration: `${duration}ms`
  })
}

/**
 * Combine results from multiple pages into one array
 * @param {object} firstPage - First page response
 * @param {array} additionalResults - Results from subsequent pages
 * @returns {Promise<object>} Object containing the max results cap, the max results per page and the total results available
 */
const preparePaginationNumbers = firstPage => {
  return {
    cap: getMaximumResultsCap(),
    maxResults: firstPage?.header?.maxresults,
    totalResults: firstPage?.header?.totalresults
  }
}

/**
 * Fetch all pages from OS Places and return the results
 * @param {string} postcode - The postcode being searched
 * @param {number} startTime - Start timestamp for telemetry
 * @returns {Array} All the results from OS Places
 */
const fetchResults = async (postcode, startTime) => {
  const firstPage = await fetchFirstPage(postcode)

  if (!firstPage) {
    return null
  }

  const { cap, maxResults, totalResults } = preparePaginationNumbers(firstPage)
  const { additionalResults, failedPages, additionalPagesFetched } = await fetchAdditionalPagesIfNecessary({
    totalResults,
    maxResults,
    postcode,
    cap
  })

  const allResults = combineFirstAndAdditionalResults(firstPage, additionalResults)

  const resultsData = {
    cap,
    failedPages,
    maxResults,
    pagesFetched: 1 + additionalPagesFetched,
    postcode,
    resultsLength: allResults.length,
    totalResults
  }

  checkForFailedPages(resultsData)
  checkIfCapExceeded(resultsData)
  logDebugData(startTime, resultsData)

  return allResults
}

export default async (premises, postcode) => {
  const startTime = Date.now()

  const allResults = await fetchResults(postcode, startTime)
  if (!allResults) {
    return []
  }

  const filteredResults = filterAndOrderResults(allResults, premises)

  debug({ premises: premises || null, filteredCount: filteredResults.length })

  return mapResults(filteredResults)
}
