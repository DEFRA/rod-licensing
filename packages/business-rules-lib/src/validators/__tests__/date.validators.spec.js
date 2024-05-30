import { dateMissing, licenceStartDateValid, birthDateValid, dateNotNumber } from '../date.validators.js'

describe('DateValidator', () => {
  const INVALID_DATE_ERROR_MESSAGE = '"value" must be a real date'
  const NUMBERS_DATE_ERROR_MESSAGE = 'Enter only numbers'

  describe('dateMissing', () => {
    it.each([
      ['day', '2000-02-', 'date.dayMissing', 'Day is missing'],
      ['month', '2000--01', 'date.monthMissing', 'Month is missing'],
      ['year', '-02-01', 'date.yearMissing', 'Year is missing'],
      ['day and month', '2000--', 'date.daymonthMissing', 'Enter a licence start date'],
      ['day and year', '-02-', 'date.dayyearMissing', 'Enter a licence start date'],
      ['month and year', '--01', 'date.monthyearMissing', 'Enter a licence start date'],
      ['day, month and year', '--', 'date.daymonthyearMissing', 'Enter a licence start date']
    ])('throws if %s is missing', async (missing, format, errorType, message) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: message }))
      }

      const result = dateMissing(day, month, year, date, helpers)

      expect(result).toEqual({
        value: date,
        errors: { type: errorType, message: message }
      })
    })

    it('does not throw date missing error message if no values missing', async () => {
      const date = '2024-02-01'
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = dateMissing(day, month, year, date, helpers)

      expect(result).toBeNull()
    })
  })

  describe('dateNotNumber', () => {
    it.each([
      ['day', '2000-02-ee', 'date.dayNotNumber'],
      ['month', '2000-ee-01', 'date.monthNotNumber'],
      ['year', 'eeee-02-01', 'date.yearNotNumber'],
      ['day and month', '2000-ee-ee', 'date.daymonthNotNumber'],
      ['day and year', 'eeee-02-ee', 'date.dayyearNotNumber'],
      ['month and year', 'eeee-ee-01', 'date.monthyearNotNumber'],
      ['day, month and year', 'eeee-ee-ee', 'date.daymonthyearNotNumber']
    ])('throws if %s is not a number', async (string, format, errorType) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: NUMBERS_DATE_ERROR_MESSAGE }))
      }

      const result = dateNotNumber(day, month, year, date, helpers)

      expect(result).toEqual({
        value: date,
        errors: { type: errorType, message: NUMBERS_DATE_ERROR_MESSAGE }
      })
    })

    it('does not throw date not number error message if date is all numbers', async () => {
      const date = '2024-02-01'
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = dateNotNumber(day, month, year, date, helpers)

      expect(result).toBeNull()
    })
  })

  describe('licenceStartDateValid', () => {
    it.each([
      ['day', '2000-02-45', 'date.dayInvalid'],
      ['month', '2000-17-01', 'date.monthInvalid'],
      ['day and month', '2000-13-67', 'date.daymonthInvalid']
    ])('throws if %s is not valid', async (invalid, format, errorType) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = licenceStartDateValid(day, month, year, date, helpers)

      expect(result).toEqual({
        value: date,
        errors: { type: errorType, message: INVALID_DATE_ERROR_MESSAGE }
      })
    })

    it.each([['2023-02-29'], ['2022-02-29'], ['2021-02-29']])('throws if 29th February and is not a leap year', async format => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = licenceStartDateValid(day, month, year, date, helpers)

      expect(result).toEqual({
        value: date,
        errors: { type: 'date.dayInvalid', message: INVALID_DATE_ERROR_MESSAGE }
      })
    })

    it('does not throw invalid date error message if 29th February and is a leap year', async () => {
      const date = '2024-02-29'
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = licenceStartDateValid(day, month, year, date, helpers)

      expect(result).toBeNull()
    })

    it.each([
      ['February', '2024-02-31'],
      ['April', '2024-04-31'],
      ['June', '2024-06-31'],
      ['September', '2024-09-31'],
      ['November', '2024-11-31']
    ])('throws if 31st day but month is %s which only has 30 days', async (monthCheck, format) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = licenceStartDateValid(day, month, year, date, helpers)

      expect(result).toEqual({
        value: date,
        errors: { type: 'date.dayInvalid', message: INVALID_DATE_ERROR_MESSAGE }
      })
    })

    it.each([
      ['February', '2024-02-1'],
      ['April', '2024-04-16'],
      ['June', '2024-06-21'],
      ['September', '2024-09-22'],
      ['November', '2024-11-30']
    ])('does not throw if correct day when month is %s which only has 30 days', async (monthCheck, format) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = licenceStartDateValid(day, month, year, date, helpers)

      expect(result).toBeNull()
    })

    it.each([
      ['January', '2023-01-31'],
      ['March', '2023-03-31'],
      ['May', '2023-05-31'],
      ['July', '2023-07-31'],
      ['August', '2023-08-31'],
      ['October', '2023-10-31'],
      ['December', '2023-12-31']
    ])('does not throws if 31st day when month is %s', async (monthCheck, format) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = licenceStartDateValid(day, month, year, date, helpers)

      expect(result).toBeNull()
    })
  })

  describe('birthDateValid', () => {
    it.each([
      ['day', '2000-02-45', 'date.dayInvalid'],
      ['month', '2000-17-01', 'date.monthInvalid'],
      ['year', '00-02-01', 'date.yearInvalid'],
      ['day and month', '2000-13-67', 'date.daymonthInvalid'],
      ['day and year', '00-02-41', 'date.dayyearInvalid'],
      ['month and year', '00-14-01', 'date.monthyearInvalid'],
      ['day, month and year', '00-14-35', 'date.daymonthyearInvalid']
    ])('throws if %s is not valid', async (invalid, format, errorType) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = birthDateValid(day, month, year, date, helpers)

      expect(result).toEqual({
        value: date,
        errors: { type: errorType, message: INVALID_DATE_ERROR_MESSAGE }
      })
    })

    it.each([['2023-02-29'], ['2022-02-29'], ['2021-02-29']])('throws if 29th February and is not a leap year', async format => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = birthDateValid(day, month, year, date, helpers)

      expect(result).toEqual({
        value: date,
        errors: { type: 'date.dayInvalid', message: INVALID_DATE_ERROR_MESSAGE }
      })
    })

    it('does not throw invalid date error message if 29th February and is a leap year', async () => {
      const date = '2024-02-29'
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = birthDateValid(day, month, year, date, helpers)

      expect(result).toBeNull()
    })

    it.each([
      ['February', '2024-02-31'],
      ['April', '2024-04-31'],
      ['June', '2024-06-31'],
      ['September', '2024-09-31'],
      ['November', '2024-11-31']
    ])('throws if 31st day but month is %s which only has 30 days', async (monthCheck, format) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = birthDateValid(day, month, year, date, helpers)

      expect(result).toEqual({
        value: date,
        errors: { type: 'date.dayInvalid', message: INVALID_DATE_ERROR_MESSAGE }
      })
    })

    it.each([
      ['February', '2024-02-1'],
      ['April', '2024-04-16'],
      ['June', '2024-06-21'],
      ['September', '2024-09-22'],
      ['November', '2024-11-30']
    ])('does not throw if correct day when month is %s which only has 30 days', async (monthCheck, format) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = birthDateValid(day, month, year, date, helpers)

      expect(result).toBeNull()
    })

    it.each([
      ['January', '2023-01-31'],
      ['March', '2023-03-31'],
      ['May', '2023-05-31'],
      ['July', '2023-07-31'],
      ['August', '2023-08-31'],
      ['October', '2023-10-31'],
      ['December', '2023-12-31']
    ])('does not throws if 31st day when month is %s', async (monthCheck, format) => {
      const date = format
      const [year, month, day] = date.split('-')
      const helpers = {
        error: jest.fn(type => ({ type, message: INVALID_DATE_ERROR_MESSAGE }))
      }

      const result = birthDateValid(day, month, year, date, helpers)

      expect(result).toBeNull()
    })
  })
})
