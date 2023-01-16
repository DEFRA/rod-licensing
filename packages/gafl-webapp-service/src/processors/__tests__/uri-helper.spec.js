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
    const mockRequest = {
      path: '/any/page',
      url: {
        search
      }
    }
    const result = addLanguageCodeToUri(mockRequest, uri)
    expect(result).toEqual(expect.stringMatching(new RegExp(expected)))
  })

  describe.each([
    ['https://my-url.com/path?data=true', 'https://my-url.com/path?data=true&lang=cy'],
    ['https://my-url.com/path?data-1=false&data-2=9', 'https://my-url.com/path?data-1=false&data-2=9&lang=cy']
  ])('', (urlToDecorate, decoratedUrl) => {
    it('if the supplied url has a querystring already, the language parameter is added to the end with an ampersand', () => {
      const mockRequest = {
        path: '/any/page',
        url: {
          search: '?lang=cy'
        }
      }
      const result = addLanguageCodeToUri(mockRequest, urlToDecorate)
      expect(result).toEqual(decoratedUrl)
    })

    it('if the request.path is used instead of a url and has a querystring, the language parameter is added to the end with an ampersand', () => {
      const mockRequest = {
        path: urlToDecorate,
        url: {
          search: '?lang=cy'
        }
      }
      const result = addLanguageCodeToUri(mockRequest, urlToDecorate)
      expect(result).toEqual(decoratedUrl)
    })
  })

  describe.each(['https://my-url.com/path?data=true&lang=cy', 'https://my-url.com/path?lang=cy'])('', path => {
    it('if the supplied url already has a language parameter on it, it does not add a duplicate parameter', () => {
      const mockRequest = {
        path: path,
        url: {
          search: '?lang=cy'
        }
      }
      const result = addLanguageCodeToUri(mockRequest, path)
      expect(result).toEqual(path)
    })
  })
})
