import { getData, getBodyMessage } from '../route'
import { NEW_TRANSACTION } from '../../../../uri.js'
import { RENEWAL_ERROR_REASON } from '../../../../constants'

import englishTranslations from '../../../../locales/en.json'
import welshTranslations from '../../../../locales/cy.json'

describe('renewal-inactive > route', () => {
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        }
      }
    }),
    i18n: {
      getCatalog: jest.fn(() => englishTranslations)
    }
  }
  describe('getData', () => {
    it('should return the reason the renewal is inactive', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE } }))
      const result = await getData(mockRequest)
      expect(result.reason).toBe(RENEWAL_ERROR_REASON.NOT_DUE)
    })

    it('should return the new transation uri', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: {} }))
      const result = await getData(mockRequest)
      expect(result.uri.new).toBe(NEW_TRANSACTION.uri)
    })

    it('should return the body message', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE },
        referenceNumber: 'ABC123'
      }))
      const result = await getData(mockRequest)
      expect(result.bodyMessage).toBe('The licence ending in ABC123 does not expire until 19 May 2022')
    })
  })

  describe('getBodyMessage', () => {
    it.each([
      [
        'The licence ending in ABC123 does not expire until 13 December 2020',
        RENEWAL_ERROR_REASON.NOT_DUE,
        'ABC123',
        '13 December 2020',
        englishTranslations
      ],
      [
        'The licence ending in ABC123 has expired on 13 December 2020 and can no longer be renewed',
        RENEWAL_ERROR_REASON.EXPIRED,
        'ABC123',
        '13 December 2020',
        englishTranslations
      ],
      [
        'The licence ending in ABC123 is not a 12 month licence and cannot be renewed.',
        RENEWAL_ERROR_REASON.NOT_ANNUAL,
        'ABC123',
        '13 December 2020',
        englishTranslations
      ],
      [
        'The licence ending in ABC123 does not expire until 13 December 2020',
        RENEWAL_ERROR_REASON.NOT_DUE,
        'ABC123',
        '13 December 2020',
        welshTranslations
      ],
      [
        'The licence ending in ABC123 has expired on 13 December 2020 and can no longer be renewed',
        RENEWAL_ERROR_REASON.EXPIRED,
        'ABC123',
        '13 December 2020',
        welshTranslations
      ],
      [
        'The licence ending in ABC123 is not a 12 month licence and cannot be renewed.',
        RENEWAL_ERROR_REASON.NOT_ANNUAL,
        'ABC123',
        '13 December 2020',
        welshTranslations
      ]
    ])('should return the message %s if the reason is %s', (expected, reason, referenceNumber, validTo, translation) => {
      const result = getBodyMessage(translation, reason, referenceNumber, validTo)
      expect(result).toBe(expected)
    })
  })
})
