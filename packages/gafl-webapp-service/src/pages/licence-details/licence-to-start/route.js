import moment from 'moment-timezone'
import { START_AFTER_PAYMENT_MINUTES, ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { LICENCE_TO_START } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { startDateValidator } from '../../../schema/validators/validators.js'

export const getData = async request => {
  const fmt = 'DD MM YYYY'
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    isLicenceForYou,
    exampleStartDate: moment().tz(SERVICE_LOCAL_TIME).add(1, 'days').format(fmt),
    minStartDate: moment().tz(SERVICE_LOCAL_TIME).format(fmt),
    maxStartDate: moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days').format(fmt),
    advancedPurchaseMaxDays: ADVANCED_PURCHASE_MAX_DAYS,
    startAfterPaymentMinutes: START_AFTER_PAYMENT_MINUTES
  }
}

export default pageRoute(LICENCE_TO_START.page, LICENCE_TO_START.uri, startDateValidator, nextPage, getData)
