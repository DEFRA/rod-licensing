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

// permission:  {
//   licensee: {
//     id: 'a6813a25-f68e-f011-b4cc-7c1e52fb54a7',
//     firstName: 'Adult',
//     lastName: 'Senior-Transition-Manual',
//     birthDate: '1960-08-16',
//     email: 'darren.mccormac@environment-agency.gov.uk',
//     premises: '27',
//     street: 'Avondale Circle',
//     town: 'Stafford',
//     postcode: 'ST18 0YZ',
//     preferredMethodOfConfirmation: 'Email',
//     preferredMethodOfNewsletter: 'Prefer not to be contacted',
//     preferredMethodOfReminder: 'Email',
//     postalFulfilment: false,
//     obfuscatedDob: '50196008168538',
//     countryCode: 'GB-ENG'
//   },
//   isRenewal: true,
//   licenceLength: '12M',
//   licenceType: 'Trout and coarse',
//   numberOfRods: '2',
//   isLicenceForYou: true,
//   licenceToStart: 'another-date',
//   licenceStartDate: '2026-09-11',
//   licenceStartTime: 0,
//   renewedEndDate: '2026-09-10T22:59:59.000Z',
//   renewedHasExpired: false,
//   concessions: [ { type: 'Senior', proof: [Object] } ],
//   recurringPayment: {
//     id: '3e663c2b-f68e-f011-b4cc-7c1e52fb54a7',
//     name: 'Adult Senior-Transition-Manual 2026',
//     status: 0,
//     nextDueDate: '2026-09-01T00:00:00.000Z',
//     cancelledDate: null,
//     cancelledReason: null,
//     endDate: '2026-09-10T22:59:59.000Z',
//     agreementId: 'bbp3fmp92e0flk4gkapeh3o68i',
//     publicId: 'hbuUs/sQBZSmb1vgLowJIOu6cEAlPOzWSJ243Sjj9CY=',
//     lastDigitsCardNumbers: '1111'
//   }
// }
