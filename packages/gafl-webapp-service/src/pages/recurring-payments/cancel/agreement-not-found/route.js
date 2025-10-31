import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_AGREEMENT_NOT_FOUND } from '../../../../uri.js'

const getData = () => ({
  links: {
    callCharges: 'https://www.gov.uk/call-charges',
    contactUs: 'mailto:enquiries@environment-agency.gov.uk'
  }
})

export default pageRoute(
  CANCEL_RP_AGREEMENT_NOT_FOUND.page,
  CANCEL_RP_AGREEMENT_NOT_FOUND.uri,
  () => {},
  () => {},
  getData
)
