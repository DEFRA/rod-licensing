import { validator, getData } from '../route.js'
import { nextPage } from '../../../../routes/next-page.js'
import pageRoute from '../../../../routes/page-route.js'
import { recurringLicenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { CHOOSE_PAYMENT, SET_UP_PAYMENT, TERMS_AND_CONDITIONS } from '../../../../uri.js'
import { recurringPayReminderDisplay } from '../../../../processors/recurring-pay-reminder-display.js'

jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../processors/recurring-pay-reminder-display.js')

const getSampleRequest = (permission = getMockPermission(), catalog = {}) => ({
  cache: () => ({
    helpers: {
      transaction: {
        getCurrentPermission: () => permission
      }
    }
  }),
  i18n: {
    getCatalog: () => catalog
  }
})

const getMockPermission = (cost) => ({
  permit: { cost }
})

describe('route', () => {
  describe('validator', () => {
    it('validator should validate "yes" as a valid choice', () => {
      const result = validator.validate({ agree: 'yes' })
      expect(result.error).toBeUndefined()
    })

    it('validator should not validate an invalid choice', () => {
      const result = validator.validate({ agree: 'invalid' })
      expect(result.error).toBeDefined()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with set-up-payment, /buy/set-up-recurring-card-payment, validator, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith(SET_UP_PAYMENT.page, SET_UP_PAYMENT.uri, validator, nextPage, getData)
    })
  })

  describe('getData', () => {
    it.each([[14], [6], [7]
    ])('cost equals permission.permit.cost', async (cost) => {
      const request = getSampleRequest(getMockPermission(cost))

      const result = await getData(request)

      expect(result.cost).toBe(cost)
    })

    it('type equals return of recurringLicenceTypeDisplay', async () => {
      const returnValue = Symbol('return value')
      recurringLicenceTypeDisplay.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest())

      expect(result.type).toEqual(returnValue)
    })

    it('recurringLicenceTypeDisplay is called with permission and getCatalog', async () => {
      const catalog = Symbol('mock catalog')
      const permission = getMockPermission()
      const request = getSampleRequest(permission, catalog)

      await getData(request)

      expect(recurringLicenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('reminder equals return of recurringPayReminderDisplay', async () => {
      const returnValue = Symbol('return value')
      recurringPayReminderDisplay.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest())

      expect(result.reminder).toEqual(returnValue)
    })

    it('recurringPayReminderDisplay is called with permission and getCatalog', async () => {
      const catalog = Symbol('mock catalog')
      const permission = getMockPermission()
      const request = getSampleRequest(permission, catalog)

      await getData(request)

      expect(recurringPayReminderDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('single equals return of addLanguageCodeToUri with choose payment', async () => {
      const returnValue = Symbol('return value')
      addLanguageCodeToUri.mockReturnValue(returnValue)

      const result = await getData(getSampleRequest())

      expect(result.uri.single).toEqual(returnValue)
    })

    it('terms equals return of addLanguageCodeToUri with terms and conditions', async () => {
      const returnValue = Symbol('return value')
      addLanguageCodeToUri.mockReturnValue(returnValue)

      const result = await getData(getSampleRequest())

      expect(result.uri.single).toEqual(returnValue)
    })

    it.each([[CHOOSE_PAYMENT.uri], [TERMS_AND_CONDITIONS.uri]
    ])('addLanguageCodeToUri is called with permission and %s', async (uri) => {
      const request = getSampleRequest()

      await getData(request)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri)
    })
  })
})
