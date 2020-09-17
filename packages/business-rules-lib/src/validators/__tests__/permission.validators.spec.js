import Joi from '@hapi/joi'
import * as permissionValidation from '../permission.validators.js'

describe('permission validators', () => {
  describe('permissionNumberValidator', () => {
    it.each(['00310321-2DC3FAS-F4A315', ' 00310321-2DC3FAS-F4Z315 '])('validates the permission number "%s"', async number => {
      await expect(permissionValidation.createPermissionNumberValidator(Joi).validateAsync(number)).resolves.toEqual(number.trim())
    })
  })
  describe('permissionNumberUniqueComponentValidator', () => {
    it.each(['F4A315', ' F4Z315 '])('validates the permission number "%s"', async number => {
      await expect(permissionValidation.permissionNumberUniqueComponentValidator(Joi).validateAsync(number)).resolves.toEqual(number.trim())
    })
  })
})
