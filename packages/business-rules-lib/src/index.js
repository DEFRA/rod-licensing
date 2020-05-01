import * as contactValidation from './validators/contact.js'
import * as permissionValidation from './validators/permission.js'
import * as businessConstants from './constants.js'

export * from './util/ages.js'
export const validation = {
  contact: contactValidation,
  permission: permissionValidation,
  businessConstants: businessConstants
}
