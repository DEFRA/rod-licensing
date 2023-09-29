import { welshEnabledAndApplied } from '../page-language-helper.js'

describe('welshEnabledAndApplied', () => {
  describe('welshEnabledAndApplied', () => {
    it('returns false when SHOW_WELSH_CONTENT is not true', async () => {
      process.env.SHOW_WELSH_CONTENT = false
      const request = { query: { lang: 'cy' } }

      const result = welshEnabledAndApplied(request)
      expect(result).toEqual(false)
    })

    it('returns false when SHOW_WELSH_CONTENT is true but the lang is not set to cy', async () => {
      process.env.SHOW_WELSH_CONTENT = true
      const request = { query: { lang: 'en' } }

      const result = welshEnabledAndApplied(request)
      expect(result).toEqual(false)
    })

    it('returns true when SHOW_WELSH_CONTENT is true and the lang is set to cy', async () => {
      process.env.SHOW_WELSH_CONTENT = true
      const request = { query: { lang: 'cy' } }

      const result = welshEnabledAndApplied(request)
      expect(result).toEqual(true)
    })
  })
})
