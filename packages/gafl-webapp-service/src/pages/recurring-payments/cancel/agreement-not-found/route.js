import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_AGREEMENT_NOT_FOUND, CANCEL_RP_IDENTIFY } from '../../../../uri.js'

const getData = async request => {
  const {
    payload: { referenceNumber }
  } = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)
  return {
    referenceNumber: referenceNumber.toUpperCase(),
    links: {
      callCharges: 'https://www.gov.uk/call-charges',
      contactUs: 'mailto:enquiries@environment-agency.gov.uk'
    }
  }
}

export default pageRoute(
  CANCEL_RP_AGREEMENT_NOT_FOUND.page,
  CANCEL_RP_AGREEMENT_NOT_FOUND.uri,
  () => {},
  () => {},
  getData
)
