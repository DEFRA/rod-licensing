import searchResultsNone from './search-results-none.js'
import searchResultsOne from './search-results-one.js'
import searchResultsMany from './search-results-many.js'

const fetch = jest.genMockFromModule('node-fetch')

fetch
  .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsMany })))
  .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsOne })))
  .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsNone })))
  .mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error('Fetch error'))))

export default fetch
