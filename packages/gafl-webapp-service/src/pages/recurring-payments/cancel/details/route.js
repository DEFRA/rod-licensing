import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_DETAILS, CANCEL_RP_CONFIRM } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import moment from 'moment-timezone'
import { cacheDateFormat, dateDisplayFormat } from '../../../../processors/date-and-time-display.js'

const getLicenseeDetailsSummaryRows = (currentPermission, mssgs, locale) => [
  {
    key: { text: mssgs.rp_cancel_details_licence_holder },
    value: { text: `${currentPermission.permission.licensee.firstName} ${currentPermission.permission.licensee.lastName}` }
  },
  { key: { text: mssgs.rp_cancel_details_licence_type }, value: { text: currentPermission.permission.permit.description } },
  {
    key: { text: mssgs.rp_cancel_details_payment_card },
    value: { text: `**** **** **** ${currentPermission.recurringPayment.lastDigitsCardNumbers}` }
  },
  { key: { text: mssgs.rp_cancel_details_last_purchased }, value: { text: currentPermission.permission.referenceNumber } },
  {
    key: { text: mssgs.rp_cancel_details_licence_valid_until },
    value: { text: moment(currentPermission.permission.endDate, cacheDateFormat, locale).format(dateDisplayFormat) }
  }
]

export const getData = async request => {
  const currentPermission = await request.cache().helpers.transaction.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()

  return {
    mssgs,
    summaryTable: getLicenseeDetailsSummaryRows(currentPermission, mssgs, request.locale)
  }
}

export default pageRoute(
  CANCEL_RP_DETAILS.page,
  CANCEL_RP_DETAILS.uri,
  () => {},
  request => addLanguageCodeToUri(request, CANCEL_RP_CONFIRM.uri),
  getData
)
