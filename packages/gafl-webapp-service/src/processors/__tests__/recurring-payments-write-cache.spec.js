import { setupCancelRecurringPaymentCacheFromAuthResult } from '../recurring-payments-write-cache.js'

describe('setUpCancelRecurringPaymentCacheFromAuthenticationResult', () => {
  const getSampleAuthResult = overrides => {
    const defaults = {
      referenceNumber: '23270624-2WC3FSD-ABNCY4',
      endDate: '2024-12-31',
      licensee: { firstName: 'Brenin', lastName: 'Pysgotwr' },
      permit: { description: 'Coarse 6 month 15 Rod Licence (Half)' },
      recurringPayment: { lastDigitsCardNumbers: '5678' }
    }

    return {
      permission: {
        referenceNumber: overrides.referenceNumber || defaults.referenceNumber,
        endDate: overrides.endDate || defaults.endDate,
        licensee: {
          ...defaults.licensee,
          ...(overrides.licensee ? overrides.licensee : {})
        },
        permit: {
          ...defaults.permit,
          ...(overrides.permit ? overrides.permit : {})
        }
      },
      recurringPayment: {
        ...defaults.recurringPayment,
        ...(overrides.recurringPayment ? overrides.recurringPayment : {})
      }
    }
  }

  const getSampleRequest = setCurrentPermission => ({
    cache: () => ({
      helpers: {
        transaction: {
          setCurrentPermission
        }
      }
    })
  })

  describe('permission caching', () => {
    it.each([
      ['referenceNumber', '23270624-2WC3FSD-ABNCY4'],
      ['endDate', '2024-12-31'],
      ['licensee', { firstName: 'John', lastName: 'Bull' }],
      ['permit', { description: 'Coarse 12 month 2 Rod Licence (Full)' }]
    ])("Adds permission %s, value '%s', to transaction cache", async (fieldName, fieldValue) => {
      const setCurrentPermission = jest.fn()
      const mockRequest = getSampleRequest(setCurrentPermission)
      const authResult = getSampleAuthResult({ [fieldName]: fieldValue })

      await setupCancelRecurringPaymentCacheFromAuthResult(mockRequest, authResult)

      expect(setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: expect.objectContaining({
            [fieldName]: fieldValue
          })
        })
      )
    })

    it.each([
      ['licensee', { anotherProperty: 'Should not be there' }],
      ['permit', { altProp: 'Should not be here' }]
    ])('Omits extraneous properties from permission %s', async (fieldName, fieldValue) => {
      const setCurrentPermission = jest.fn()
      const mockRequest = getSampleRequest(setCurrentPermission)

      const authResult = getSampleAuthResult({ [fieldName]: fieldValue })

      await setupCancelRecurringPaymentCacheFromAuthResult(mockRequest, authResult)

      expect(setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: expect.not.objectContaining({
            [fieldName]: fieldValue
          })
        })
      )
    })
  })

  describe('recurring payment caching', () => {
    it('adds recurring payment payment card number last digits to transaction cache', async () => {
      const setCurrentPermission = jest.fn()
      const mockRequest = getSampleRequest(setCurrentPermission)

      const authResult = getSampleAuthResult({ recurringPayment: { lastDigitsCardNumbers: '1234' } })

      await setupCancelRecurringPaymentCacheFromAuthResult(mockRequest, authResult)

      expect(setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          recurringPayment: expect.objectContaining({
            lastDigitsCardNumbers: '1234'
          })
        })
      )
    })

    it('omits extraneous properties from recurring payment', async () => {
      const setCurrentPermission = jest.fn()
      const mockRequest = getSampleRequest(setCurrentPermission)

      const authResult = getSampleAuthResult({ recurringPayment: { someOtherProp: 'Should not be here' } })

      await setupCancelRecurringPaymentCacheFromAuthResult(mockRequest, authResult)

      expect(setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          recurringPayment: expect.not.objectContaining({
            someOtherProp: 'Should not be here'
          })
        })
      )
    })
  })
})
