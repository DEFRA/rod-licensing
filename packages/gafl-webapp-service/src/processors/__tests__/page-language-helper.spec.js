import { welshEnabledAndApplied } from '../page-language-helper.js'

describe('welshEnabledAndApplied', () => {
  describe('welshEnabledAndApplied', () => {
    it('returns false when the lang is not set to cy', async () => {
      const request = { query: { lang: 'en' } }

      const result = welshEnabledAndApplied(request)
      expect(result).toEqual(false)
    })

    it('returns true when the lang is set to cy', async () => {
      const request = { query: { lang: 'cy' } }

      const result = welshEnabledAndApplied(request)
      expect(result).toEqual(true)
    })
  })
})
