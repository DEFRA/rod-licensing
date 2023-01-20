import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { REMOVE_LICENCE, VIEW_LICENCES } from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../processors/licence-type-display.js'
import { displayStartTime } from '../../../processors/date-and-time-display.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

export const getData = async request => {
  await request.cache().helpers.status.set({ currentPermissionIdx: parseInt(request.query.permissionIndex) })
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()

  return {
    licenceHolder: `${permission.licensee.firstName} ${permission.licensee.lastName}`,
    type: licenceTypeDisplay(permission, mssgs),
    length: licenceTypeAndLengthDisplay(permission, mssgs),
    start: displayStartTime(request, permission),
    price: permission.permit.cost,
    uri: {
      view_licences: addLanguageCodeToUri(request, VIEW_LICENCES.uri)
    }
  }
}

export const validator = Joi.object({}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(REMOVE_LICENCE.page, REMOVE_LICENCE.uri, validator, nextPage, getData)
