import Joi from 'joi'
import * as dateValidation from '../date.validators.js'

describe('date validators', () => {
  describe('dayValidator', () => {
    it.each([1, 15, 31])('expects an integer between 1 and 31', async value => {
      await expect(dateValidation.createDayValidator(Joi).validateAsync(value)).resolves.toEqual(value)
    })

    it.each([
      [0, 'must be greater than or equal to 1'],
      [32, 'must be less than or equal to 31'],
      [1.5, 'must be an integer'],
      ['foo', 'must be a number'],
      ['', 'must be a number'],
      [null, 'must be a number'],
      [undefined, 'is required']
    ])('throws an error if the value is invalid', async (value, message) => {
      await expect(dateValidation.createDayValidator(Joi).validateAsync(value)).rejects.toThrow('"value" ' + message)
    })
  })

  describe('monthValidator', () => {
    it.each([1, 6, 12])('expects an integer between 1 and 12', async value => {
      await expect(dateValidation.createMonthValidator(Joi).validateAsync(value)).resolves.toEqual(value)
    })

    it.each([
      [0, 'must be greater than or equal to 1'],
      [13, 'must be less than or equal to 12'],
      [1.5, 'must be an integer'],
      ['foo', 'must be a number'],
      ['', 'must be a number'],
      [null, 'must be a number'],
      [undefined, 'is required']
    ])('throws an error if the value is invalid', async (value, message) => {
      await expect(dateValidation.createMonthValidator(Joi).validateAsync(value)).rejects.toThrow('"value" ' + message)
    })
  })

  describe('yearValidator', () => {
    it.each([
      [1900, 1900, 2024],
      [1991, 1950, 2000],
      [2500, 1500, 2500]
    ])('expects an integer between the minYear and maxYear', async (value, minYear, maxYear) => {
      await expect(dateValidation.createYearValidator(Joi, minYear, maxYear).validateAsync(value)).resolves.toEqual(value)
    })

    it.each([
      [1800, 'must be greater than or equal to 1900'],
      [2500, 'must be less than or equal to 2024'],
      [1950.5, 'must be an integer'],
      ['foo', 'must be a number'],
      ['', 'must be a number'],
      [null, 'must be a number'],
      [undefined, 'is required']
    ])('throws an error if the value is invalid', async (value, message) => {
      await expect(dateValidation.createYearValidator(Joi, 1900, 2024).validateAsync(value)).rejects.toThrow('"value" ' + message)
    })
  })

  describe('createNumericCharacterValidator', () => {
    it.each(['1', '99', '0'])('expects a string made of valid numeric characters', async value => {
      await expect(dateValidation.createNumericCharacterValidator(Joi).validateAsync(value)).resolves.toEqual(value)
    })

    it.each(['foo', '1.5'])('throws an error if the characters are not numeric', async value => {
      await expect(dateValidation.createNumericCharacterValidator(Joi).validateAsync(value)).rejects.toThrow(
        '"value" with value "' + value + '" fails to match the required pattern: /^\\d*$/'
      )
    })
  })

  describe('createRealDateValidator', () => {
    it.each([
      { year: 2021, month: 1, day: 1 },
      { year: 2023, month: 6, day: 30 },
      { year: 2024, month: 2, day: 29 },
      { year: 1950, month: 12, day: 3 }
    ])('expects a real date', async value => {
      await expect(dateValidation.createRealDateValidator(Joi).validateAsync(value)).resolves.toEqual(value)
    })

    it.each([
      { year: 2021, month: 1, day: 32 },
      { year: 2023, month: 2, day: 29 },
      { year: 1950, month: 13, day: 31 },
      { year: 'foo', month: 1, day: 1 },
      { year: undefined, month: 1, day: 1 }
    ])('throws an error if the date is not real', async value => {
      await expect(dateValidation.createRealDateValidator(Joi).validateAsync(value)).rejects.toThrow('"value" must be a real date')
    })
  })
})
