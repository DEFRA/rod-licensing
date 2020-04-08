import each from 'jest-each'
import * as permissionValidation from '../permission.js'

describe('permission validators', () => {
  describe('permissionNumberValidator', () => {
    each(['00310321-2DC3FAS-F4A315', ' 00310321-2DC3FAS-F4A315 ']).it('validates the permission number "%s"', async number => {
      await expect(permissionValidation.permissionNumberValidator.validateAsync(number)).resolves.toEqual(number.trim())
    })
  })
})
