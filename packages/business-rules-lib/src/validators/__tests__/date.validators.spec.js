import Joi from 'joi'
import * as dateValidation from '../date.validators.js'

describe('date validators', () => {
  describe('dayValidator', () => {
    it.each([1, 15, 31])('validates if %s is an integer between 1 and 31', async value => {
      await expect(dateValidation.createDayValidator(Joi).validateAsync(value)).resolves.toEqual(value)
    })

    it.each([
      ['less than 1', 0, 'must be greater than or equal to 1'],
      ['greater than 31', 32, 'must be less than or equal to 31'],
      ['a non-integer number', 1.5, 'must be an integer'],
      ['a string', 'foo', 'must be a number'],
      ['an empty string', '', 'must be a number'],
      ['null', null, 'must be a number'],
      ['undefined', undefined, 'is required']
    ])('throws an error if the value is %s', async (_desc, value, message) => {
      await expect(dateValidation.createDayValidator(Joi).validateAsync(value)).rejects.toThrow('"value" ' + message)
    })
  })

  describe('monthValidator', () => {
    it.each([1, 6, 12])('validates if %s is an integer between 1 and 12', async value => {
      await expect(dateValidation.createMonthValidator(Joi).validateAsync(value)).resolves.toEqual(value)
    })

    it.each([
      ['less than 1', 0, 'must be greater than or equal to 1'],
      ['greater than 12', 13, 'must be less than or equal to 12'],
      ['a non-integer number', 1.5, 'must be an integer'],
      ['a string', 'foo', 'must be a number'],
      ['an empty string', '', 'must be a number'],
      ['null', null, 'must be a number'],
      ['undefined', undefined, 'is required']
    ])('throws an error if the value is %s', async (_desc, value, message) => {
      await expect(dateValidation.createMonthValidator(Joi).validateAsync(value)).rejects.toThrow('"value" ' + message)
    })
  })

  describe('yearValidator', () => {
    it.each([
      [1900, 1900, 2024],
      [1991, 1950, 2000],
      [2500, 1500, 2500]
    ])('validates if %s is an integer between %s and %s', async (value, minYear, maxYear) => {
      await expect(dateValidation.createYearValidator(Joi, minYear, maxYear).validateAsync(value)).resolves.toEqual(value)
    })

    it.each([
      ['less than the minimum year', 1800, 'must be greater than or equal to 1900'],
      ['greater than the maximum year', 2500, 'must be less than or equal to 2024'],
      ['a non-integer number', 1950.5, 'must be an integer'],
      ['a string', 'foo', 'must be a number'],
      ['an empty string', '', 'must be a number'],
      ['null', null, 'must be a number'],
      ['undefined', undefined, 'is required']
    ])('throws an error if the value is %s', async (_desc, value, message) => {
      await expect(dateValidation.createYearValidator(Joi, 1900, 2024).validateAsync(value)).rejects.toThrow('"value" ' + message)
    })
  })

  describe('createNumericCharacterValidator', () => {
    it.each(['1', '99', '0'])('validates if %s is a string made of valid numeric characters', async value => {
      await expect(dateValidation.createNumericCharacterValidator(Joi).validateAsync(value)).resolves.toEqual(value)
    })

    it.each(['foo', '1.5'])('throws an error if %s is not a string made of numeric characters', async value => {
      await expect(dateValidation.createNumericCharacterValidator(Joi).validateAsync(value)).rejects.toThrow(
        '"value" with value "' + value + '" fails to match the required pattern: /^\\d*$/'
      )
    })
  })

  describe('createRealDateValidator', () => {
    it.each([
      ['January 1st 2021', { year: 2021, month: 1, day: 1 }],
      ['June 30th 2023', { year: 2023, month: 6, day: 30 }],
      ['February 29th 2024', { year: 2024, month: 2, day: 29 }],
      ['December 3rd 1950', { year: 1950, month: 12, day: 3 }]
    ])('validates if %s is a real date', async (_desc, value) => {
      await expect(dateValidation.createRealDateValidator(Joi).validateAsync(value)).resolves.toEqual(value)
    })

    it.each([
      ['the day does not exist in that month', { year: 2021, month: 4, day: 31 }],
      ['the 29th of February is given in a non-leap year', { year: 2023, month: 2, day: 29 }],
      ['the month is too high', { year: 1950, month: 13, day: 31 }],
      ['a field is not a valid number', { year: 'foo', month: 1, day: 1 }],
      ['a field is not defined', { year: undefined, month: 1, day: 1 }]
    ])('throws an error if %s', async (_desc, value) => {
      await expect(dateValidation.createRealDateValidator(Joi).validateAsync(value)).rejects.toThrow('"value" must be a real date')
    })
  })
})
