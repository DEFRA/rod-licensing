import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_DETAILS, CANCEL_RP_CONFIRM } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { findByExample, RecurringPayment } from '@defra-fish/dynamics-lib'

const getLicenseeDetailsSummaryRows = (permission, recurringPayment, mssgs) => [
  { key: { text: mssgs.rp_cancel_details_licence_holder }, value: { text: `${permission.licensee.firstName} ${permission.licensee.lastName}` } },
  { key: { text: mssgs.rp_cancel_details_licence_type }, value: { text: licenceTypeDisplay(permission, mssgs) } },
  { key: { text: mssgs.rp_cancel_details_payment_card }, value: { text: recurringPayment.lastDigitsCardNumbers } },
  { key: { text: mssgs.rp_cancel_details_last_purchased }, value: { text: permission.referenceNumber } },
  { key: { text: mssgs.rp_cancel_details_licence_valid_until }, value: { text: permission.endDate } }
]

const getData = async request => {
  const permission = await request.cache().helpers.status.getCurrentPermission()
  const exampleRecurringPayment = new RecurringPayment()
  exampleRecurringPayment.activePermission = permission.id
  const recurringPayments = await findByExample(exampleRecurringPayment)
  const recurringPayment = recurringPayments[0]
  const mssgs = request.i18n.getCatalog()
  return {
    mssgs,
    summaryTable: getLicenseeDetailsSummaryRows(permission, recurringPayment, mssgs),
  }
}

export default pageRoute(CANCEL_RP_DETAILS.page, CANCEL_RP_DETAILS.uri, null, request => addLanguageCodeToUri(request, CANCEL_RP_CONFIRM.uri), getData)
