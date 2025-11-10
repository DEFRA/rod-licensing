import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_DETAILS, CANCEL_RP_CONFIRM } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'

const getLicenseeDetailsSummaryRows = (permission, mssgs) => [
  { key: { text: mssgs.rp_cancel_details_licence_holder }, value: { text: permission.recurringPayment.name } },
  { key: { text: mssgs.rp_cancel_details_licence_type }, value: { text: licenceTypeDisplay(permission, mssgs) } },
  { key: { text: mssgs.rp_cancel_details_payment_card }, value: { text: permission.recurringPayment.lastDigitsCardNumbers } },
  { key: { text: mssgs.rp_cancel_details_last_purchased }, value: { text: permission.licensee.id } },
  { key: { text: mssgs.rp_cancel_details_licence_valid_until }, value: { text: permission.recurringPayment.endDate } }
]

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()

  return {
    mssgs,
    summaryTable: getLicenseeDetailsSummaryRows(permission, mssgs)
  }
}

export default pageRoute(
  CANCEL_RP_DETAILS.page,
  CANCEL_RP_DETAILS.uri,
  null,
  request => addLanguageCodeToUri(request, CANCEL_RP_CONFIRM.uri),
  getData
)
