import { addLanguageCodeToUri } from '../uri-helper.js'

describe('URI Helpers: addLanguageCodeToURI', () => {
  it.each([
    ['?lang=cy', '^/path/to/a/page\\?lang=cy$', '/path/to/a/page'],
    ['?other-info=abc123&lang=cy', '^/any/page\\?lang=cy$', undefined],
    ['?extra-info=123&extra-rods=2&lang=cy&cold-beer=yes-please', '^/any/page\\?lang=cy', undefined],
    ['', '^/path/to/a/page$', '/path/to/a/page', undefined],
    ['?other-info=bbb-111', '^/any/page$', undefined],
    ['?misc-data=999&extra-rods=1&marmite=no-thanks', '^/any/old/page$', '/any/old/page']
  ])('persists the lang code when reloading the page in the event of an error', (search, expected, uri) => {
    console.log(search, expected, uri)
    const mockRequest = {
      path: '/any/page',
      url: {
        search
      }
    }
    const result = addLanguageCodeToUri(mockRequest, uri)
    expect(result).toEqual(expect.stringMatching(new RegExp(expected)))
  })
})
