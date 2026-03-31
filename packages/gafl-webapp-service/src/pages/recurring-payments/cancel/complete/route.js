import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_COMPLETE } from '../../../../uri.js'
import { cacheDateFormat, dateDisplayFormat } from '../../../../processors/date-and-time-display.js'
import moment from 'moment-timezone'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

const getPreferredMethodOfContact = (preference, mssgs) => {
  if (preference === HOW_CONTACTED.email) return mssgs.rp_cancel_complete_contact_method_email
  if (preference === HOW_CONTACTED.text) return mssgs.rp_cancel_complete_contact_method_text
  return mssgs.rp_cancel_complete_contact_method_letter
}

const getData = async request => {
  const { permission } = await request.cache().helpers.transaction.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()

  return {
    licenceExpiry: moment(permission.endDate, cacheDateFormat, request.locale).format(dateDisplayFormat),
    preferredMethodOfContact: getPreferredMethodOfContact(permission.licensee.preferredMethodOfConfirmation, mssgs)
  }
}

export default pageRoute(
  CANCEL_RP_COMPLETE.page,
  CANCEL_RP_COMPLETE.uri,
  () => {},
  () => {},
  getData
)
