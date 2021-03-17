import pageRoute from '../../../../routes/page-route.js'
import { CONTACT, LICENCE_FULFILMENT } from '../../../../uri.js'
import { nextPage } from '../../../../routes/next-page.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'

const isPhysicalPermission = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // page is only permitted for physical licences
  if (!isPhysical(permission)) {
    throw new GetDataRedirect(CONTACT.uri)
  }
}

export default pageRoute(LICENCE_FULFILMENT.page, LICENCE_FULFILMENT.uri, undefined, nextPage, isPhysicalPermission)
