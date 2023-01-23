import * as contactValidation from './validators/contact.validators.js'
import * as permissionValidation from './validators/permission.validators.js'
export * from './util/ages.js'
export * from './util/permissions.js'
export * from './constants.js'

export const validation = {
  contact: contactValidation,
  permission: permissionValidation
}
