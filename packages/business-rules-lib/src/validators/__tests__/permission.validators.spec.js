import Joi from 'joi'
import * as permissionValidation from '../permission.validators.js'
import moment from 'moment-timezone'

jest.mock('./date.validators.spec.js', () => ({
  ...jest.requireActual('./date.validators.spec.js'),
  dateMissing: jest.fn(),
  dateNotNumber: jest.fn(),
  licenceStartDateValid: jest.fn()
}))

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
  describe('licenceDateValidator', () => {
    beforeEach(jest.clearAllMocks)
    const validDate = moment()

    it('allows today date', async () => {
      const date = validDate.format('YYYY-MM-DD')
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(date)).resolves.toEqual(date)
    })

    it('allows a date in alternative format', async () => {
      const dateIn = validDate.format('YYYY-M-D')
      const dateOutput = validDate.format('YYYY-MM-DD')
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(dateIn)).resolves.toEqual(dateOutput)
    })

    it('throws if given date in past', async () => {
      await expect(
        permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(moment().subtract(2, 'days').format('YYYY-MM-DD'))
      ).rejects.toThrow('"value" date before minimum allowed')
    })

    it('throws if given a date 30 days in future', async () => {
      await expect(
        permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(moment().add(31, 'days').format('YYYY-MM-DD'))
      ).rejects.toThrow('"value" date after maximum allowed')
    })

    it('returns the result of dateMissing if not null', () => {
      const date = '2020-01-'
      const validator = permissionValidation.createLicenceStartDateValidator(Joi)

      const result = validator.validate(date)

      expect(result.error.details[0].message).toBe('Day is missing')
    })

    it('returns the result of dateNotNumber if not null', () => {
      const date = '2020-01-ee'
      const validator = permissionValidation.createLicenceStartDateValidator(Joi)

      const result = validator.validate(date)

      expect(result.error.details[0].message).toBe('Enter only numbers')
    })

    it('returns the result of licenceStartDateValid if not null', () => {
      const date = '2020-01-41'
      const validator = permissionValidation.createLicenceStartDateValidator(Joi)

      const result = validator.validate(date)

      expect(result.error.details[0].message).toBe('"value" must be a real date')
    })
  })
})
