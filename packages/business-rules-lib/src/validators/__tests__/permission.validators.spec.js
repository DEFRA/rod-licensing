import Joi from 'joi'
import * as permissionValidation from '../permission.validators.js'
import moment from 'moment-timezone'

const INVALID_DATE_ERROR_MESSAGE = '"value" must be in [YYYY-MM-DD] format'

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
  describe('birthDateValidator', () => {
    const validDate = moment()

    it('allows today date', async () => {
      const testValue = validDate.format('YYYY-MM-DD')
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(testValue)).resolves.toEqual(testValue)
    })

    it('allows a date in alternative format', async () => {
      const testValueIn = validDate.format('YYYY-M-D')
      const testValueOut = validDate.format('YYYY-MM-DD')
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(testValueIn)).resolves.toEqual(testValueOut)
    })

    it('throws if given an invalid format', async () => {
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(validDate.format('YYYY-MM-DDThh:mm:ss'))).rejects.toThrow(
        INVALID_DATE_ERROR_MESSAGE
      )
    })

    it('throws if given an invalid date', async () => {
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync('1-111-19')).rejects.toThrow(INVALID_DATE_ERROR_MESSAGE)
    })

    it('throws if the day is missing', async () => {
      const testValueIn = validDate.format('2000-02-')
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow('Day is missing')
    })

    it('throws if the month is missing', async () => {
      const testValueIn = validDate.format('2000--01')
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow('Month is missing')
    })

    it('throws if the year is missing', async () => {
      const testValueIn = validDate.format('-02-01')
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow('Year is missing')
    })

    it.each([
      ['day and month', '2000--'],
      ['day and year', '-02-'],
      ['month and year', '--01'],
      ['day, month and year', '--']
    ])('throws if %s is missing', async (missing, format) => {
      const testValueIn = validDate.format(format)
      await expect(permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow('Enter a licence start date')
    })

    it('throws if given date in past', async () => {
      await expect(
        permissionValidation.createLicenceStartDateValidator(Joi).validateAsync(moment().subtract(2, 'days').format('YYYY-MM-DD'))
      ).rejects.toThrow('"value" date before minimum allowed')
    })

    it('throws if given a date 30 days in future', async () => {
      await expect(
        permissionValidation
          .createLicenceStartDateValidator(Joi)
          .validateAsync(moment().add(31, 'days').format('YYYY-MM-DD'))
      ).rejects.toThrow('"value" date after maximum allowed')
    })
  })
})
