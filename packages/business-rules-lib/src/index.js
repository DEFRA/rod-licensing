import * as contactValidation from './validators/contact.js'
import * as permissionValidation from './validators/permission.js'

export * from './util/ages.js'
export * from './constants.js'

export const validation = {
  contact: contactValidation,
  permission: permissionValidation
}
