import { start, stop, server, initialize } from '../__mocks__/test-utils-system.js'
import { LICENCE_LENGTH, LICENCE_TYPE } from '../uri.js'

beforeAll(
  () =>
    new Promise(resolve => {
      start(resolve)
    })
)

beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => {
  stop(d)
})

describe('Security Headers', () => {
  describe('CORP - Cross-Origin-Resource-Policy', () => {
    it.each([
      ['license length page at ' + LICENCE_LENGTH.uri, LICENCE_LENGTH.uri, 'same-origin'],
      ['license type page at ' + LICENCE_TYPE.uri, LICENCE_TYPE.uri, 'same-origin']
    ])('should set CORP to same-origin for %s', async (description, url, expectedValue) => {
      const response = await server.inject({ method: 'GET', url })

      expect(response.headers['cross-origin-resource-policy']).toBe(expectedValue)
    })
  })

  describe('COOP - Cross-Origin-Opener-Policy', () => {
    it.each([
      ['license length page at ' + LICENCE_LENGTH.uri, LICENCE_LENGTH.uri],
      ['license type page at ' + LICENCE_TYPE.uri, LICENCE_TYPE.uri]
    ])('should include COOP header for %s', async (description, url) => {
      const response = await server.inject({ method: 'GET', url })

      expect(response.headers['cross-origin-opener-policy']).toBeDefined()
    })
  })

  describe('COEP - Cross-Origin-Embedder-Policy', () => {
    it.each([
      ['license length page at ' + LICENCE_LENGTH.uri, LICENCE_LENGTH.uri],
      ['license type page at ' + LICENCE_TYPE.uri, LICENCE_TYPE.uri]
    ])('should include COEP header for %s', async (description, url) => {
      const response = await server.inject({ method: 'GET', url })

      expect(response.headers['cross-origin-embedder-policy']).toBeDefined()
    })
  })

  describe('CSP - Content-Security-Policy', () => {
    it('should include Content-Security-Policy header', async () => {
      const response = await server.inject({ method: 'GET', url: LICENCE_LENGTH.uri })

      expect(response.headers['content-security-policy']).toBeDefined()
    })

    it('should allow Google Tag Manager scripts in CSP', async () => {
      const response = await server.inject({ method: 'GET', url: LICENCE_LENGTH.uri })
      const csp = response.headers['content-security-policy']

      expect(csp).toContain('*.googletagmanager.com')
    })

    it('should allow Google Analytics in CSP', async () => {
      const response = await server.inject({ method: 'GET', url: LICENCE_LENGTH.uri })
      const csp = response.headers['content-security-policy']

      expect(csp).toContain('*.google-analytics.com')
    })
  })

  describe('Existing Security Headers', () => {
    it.each([
      ['X-Frame-Options set to DENY', 'x-frame-options', 'DENY'],
      ['X-Content-Type-Options set to nosniff', 'x-content-type-options', 'nosniff'],
      ['Strict-Transport-Security set to max-age=31536000', 'strict-transport-security', 'max-age=31536000']
    ])('should include %s', async (description, headerKey, expectedValue) => {
      const response = await server.inject({ method: 'GET', url: LICENCE_LENGTH.uri })

      expect(response.headers[headerKey]).toContain(expectedValue)
    })
  })
})
