import { validator, getData } from '../route.js'
import { nextPage } from '../../../../routes/next-page.js'
import pageRoute from '../../../../routes/page-route.js'
import { recurringLicenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { CHOOSE_PAYMENT, SET_UP_PAYMENT, TERMS_AND_CONDITIONS } from '../../../../uri.js'
import { recurringPayReminderDisplay } from '../../../../processors/recurring-pay-reminder-display.js'
import { displayPermissionPrice } from '../../../../processors/price-display.js'

jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../processors/recurring-pay-reminder-display.js')
jest.mock('../../../../processors/price-display.js')

const getSampleRequest = (permission = {}, catalog = getCatalog()) => ({
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

const getCatalog = () => ({
  recurring_payment_set_up_error: 'recurring payment error'
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
    it('returns expected values', async () => {
      const cost = Symbol('cost value')
      const type = Symbol('type value')
      const reminder = Symbol('reminder value')
      const uri = Symbol('uri value')

      displayPermissionPrice.mockReturnValueOnce(cost)
      recurringLicenceTypeDisplay.mockReturnValueOnce(type)
      recurringPayReminderDisplay.mockReturnValueOnce(reminder)
      addLanguageCodeToUri.mockReturnValue(uri)

      const result = await getData(getSampleRequest())

      expect(result).toMatchSnapshot()
    })

    it.each([
      [displayPermissionPrice, Symbol('mock catalog'), Symbol('mock permission')],
      [recurringLicenceTypeDisplay, Symbol('mock catalog'), Symbol('mock permission')],
      [recurringPayReminderDisplay, Symbol('mock catalog'), Symbol('mock permission')]
    ])('%s is called with permission and getCatalog', async (func, catalog, permission) => {
      const request = getSampleRequest(permission, catalog)

      await getData(request)

      expect(func).toHaveBeenCalledWith(permission, catalog)
    })

    it.each([[CHOOSE_PAYMENT.uri], [TERMS_AND_CONDITIONS.uri]
    ])('addLanguageCodeToUri is called with permission and %s', async (uri) => {
      const request = getSampleRequest()

      await getData(request)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri)
    })
  })
})
