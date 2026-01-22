import Joi from 'joi'
import {
  dateOfBirthValidator,
  startDateValidator,
  getDateErrorFlags,
  renewalStartDateValidator,
  getDobErrorMessage
} from '../validators.js'
import moment from 'moment-timezone'
const dateSchema = require('../../date.schema.js')

const setupMocks = () => {
  Joi.originalAssert = Joi.assert
  dateSchema.originalDateSchema = dateSchema.dateSchema
  dateSchema.originalDateSchemaInput = dateSchema.dateSchemaInput

  Joi.assert = jest.fn()
  dateSchema.dateSchema = Symbol('dateSchema')
  dateSchema.dateSchemaInput = jest.fn()
}

const tearDownMocks = () => {
  Joi.assert = Joi.originalAssert
  dateSchema.dateSchema = dateSchema.originalDateSchema
  dateSchema.dateSchemaInput = dateSchema.originalDateSchemaInput
}

describe('dateOfBirth validator', () => {
  beforeEach(jest.clearAllMocks)

  const getSamplePayload = ({ day = '', month = '', year = '' } = {}) => ({
    'date-of-birth-day': day,
    'date-of-birth-month': month,
    'date-of-birth-year': year
  })

  it('throws an error for anyone over 120 years old', () => {
    const invalidDoB = moment().subtract(120, 'years').subtract(1, 'day')
    const samplePayload = getSamplePayload({
      day: invalidDoB.format('DD'),
      month: invalidDoB.format('MM'),
      year: invalidDoB.format('YYYY')
    })
    expect(() => dateOfBirthValidator(samplePayload)).toThrow()
  })

  it('validates for anyone 120 years old', () => {
    const validDoB = moment().subtract(120, 'years')
    const samplePayload = getSamplePayload({
      day: validDoB.format('DD'),
      month: validDoB.format('MM'),
      year: validDoB.format('YYYY')
    })
    expect(() => dateOfBirthValidator(samplePayload)).not.toThrow()
  })

  it.each([
    ['today', moment()],
    ['tomorrow', moment().add(1, 'day')],
    ['in the future', moment().add(1, 'month')]
  ])('throws an error for a date of birth %s', (_desc, invalidDoB) => {
    const samplePayload = getSamplePayload({
      day: invalidDoB.format('DD'),
      month: invalidDoB.format('MM'),
      year: invalidDoB.format('YYYY')
    })
    expect(() => dateOfBirthValidator(samplePayload)).toThrow()
  })

  it.each([
    ['1-3-2004', '1', '3', '2004'],
    ['12-1-1999', '12', '1', '1999'],
    ['1-12-2006', '1', '12', '2006']
  ])('handles single digit date %s', (_desc, day, month, year) => {
    const samplePayload = getSamplePayload({
      day,
      month,
      year
    })
    expect(() => dateOfBirthValidator(samplePayload)).not.toThrow()
  })

  it.each([
    ['01', '03', '1994'],
    ['10', '12', '2004']
  ])('passes date of birth day (%s), month (%s) and year (%s) to dateSchemaInput', (day, month, year) => {
    setupMocks()
    dateOfBirthValidator(getSamplePayload({ day, month, year }))
    expect(dateSchema.dateSchemaInput).toHaveBeenCalledWith(day, month, year)
    tearDownMocks()
  })

  it('passes dateSchemaInput output and dateSchema  to Joi.assert', () => {
    setupMocks()
    const dsi = Symbol('dsi')
    dateSchema.dateSchemaInput.mockReturnValueOnce(dsi)
    dateOfBirthValidator(getSamplePayload())
    expect(Joi.assert).toHaveBeenCalledWith(dsi, dateSchema.dateSchema)
    tearDownMocks()
  })
})

describe('startDate validator', () => {
  beforeEach(jest.clearAllMocks)

  const getSamplePayload = ({ day = '', month = '', year = '' } = {}) => ({
    'licence-start-date-day': day,
    'licence-start-date-month': month,
    'licence-start-date-year': year,
    'licence-to-start': 'another-date'
  })

  it('throws an error for a licence starting before today', () => {
    const invalidStartDate = moment().subtract(1, 'day')
    const samplePayload = getSamplePayload({
      day: invalidStartDate.format('DD'),
      month: invalidStartDate.format('MM'),
      year: invalidStartDate.format('YYYY')
    })
    expect(() => startDateValidator(samplePayload)).toThrow()
  })

  it('throws an error for a licence starting more than 30 days hence', () => {
    const invalidStartDate = moment().add(31, 'days')
    const samplePayload = getSamplePayload({
      day: invalidStartDate.format('DD'),
      month: invalidStartDate.format('MM'),
      year: invalidStartDate.format('YYYY')
    })
    expect(() => startDateValidator(samplePayload)).toThrow()
  })

  it('validates for a date within the next 30 days', () => {
    const validStartDate = moment().add(4, 'days')
    const samplePayload = getSamplePayload({
      day: validStartDate.format('DD'),
      month: validStartDate.format('MM'),
      year: validStartDate.format('YYYY')
    })
    expect(() => startDateValidator(samplePayload)).not.toThrow()
  })

  it.each([
    ['1-3-2024', moment('2024-02-28')],
    ['9-7-2024', moment('2024-07-08')]
  ])('handles single digit date %s', (date, now) => {
    jest.useFakeTimers()
    jest.setSystemTime(now.toDate())

    const [day, month, year] = date.split('-')
    const samplePayload = getSamplePayload({
      day,
      month,
      year
    })
    expect(() => startDateValidator(samplePayload)).not.toThrow()
    jest.useRealTimers()
  })

  it.each([
    ['01', '03', '1994'],
    ['10', '12', '2004']
  ])('passes start date day (%s), month (%s) and year (%s) to dateSchemaInput', (day, month, year) => {
    setupMocks()
    startDateValidator(getSamplePayload({ day, month, year }))
    expect(dateSchema.dateSchemaInput).toHaveBeenCalledWith(day, month, year)
    tearDownMocks()
  })

  it('passes dateSchemaInput output and dateSchema to Joi.assert', () => {
    setupMocks()
    const dsi = Symbol('dsi')
    dateSchema.dateSchemaInput.mockReturnValueOnce(dsi)
    startDateValidator(getSamplePayload())
    expect(Joi.assert).toHaveBeenCalledWith(dsi, dateSchema.dateSchema)
    tearDownMocks()
  })

  it('passes validation if licence is set to start after payment', () => {
    const samplePayload = { 'licence-to-start': 'after-payment' }
    expect(() => startDateValidator(samplePayload)).not.toThrow()
  })

  it('throws an error if licence-to-start is set to an invalid value', () => {
    const samplePayload = { 'licence-to-start': '12th-of-never' }
    expect(() => startDateValidator(samplePayload)).toThrow()
  })
})

describe('getErrorFlags', () => {
  it('sets all error flags to be false when there are no errors', () => {
    const result = getDateErrorFlags()
    expect(result).toEqual({ isDayError: false, isMonthError: false, isYearError: false })
  })

  it.each([
    ['full-date', { isDayError: true, isMonthError: true, isYearError: true }],
    ['day-and-month', { isDayError: true, isMonthError: true, isYearError: false }],
    ['month-and-year', { isDayError: false, isMonthError: true, isYearError: true }],
    ['day-and-year', { isDayError: true, isMonthError: false, isYearError: true }],
    ['day', { isDayError: true, isMonthError: false, isYearError: false }],
    ['month', { isDayError: false, isMonthError: true, isYearError: false }],
    ['year', { isDayError: false, isMonthError: false, isYearError: true }],
    ['invalid-date', { isDayError: true, isMonthError: true, isYearError: true }],
    ['date-range', { isDayError: true, isMonthError: true, isYearError: true }],
    ['non-numeric', { isDayError: true, isMonthError: true, isYearError: true }]
  ])('when error is %s, should set %o in flags', (errorKey, expected) => {
    const error = { [errorKey]: 'anything.at.all' }

    const result = getDateErrorFlags(error)

    expect(result).toEqual(expect.objectContaining(expected))
  })
})

describe('renewalStartDateValidator', () => {
  beforeEach(jest.clearAllMocks)

  const getSamplePayload = ({ day = '', month = '', year = '' } = {}) => ({
    'licence-start-date-day': day,
    'licence-start-date-month': month,
    'licence-start-date-year': year
  })
  const renewedEndDate = moment()
  const options = {
    context: {
      app: {
        request: {
          permission: {
            renewedEndDate: renewedEndDate.toISOString()
          }
        }
      }
    }
  }
  it('throws an error for a licence starting before today', () => {
    const renewedDate = moment().subtract(1, 'day')
    const samplePayload = getSamplePayload({
      day: renewedDate.format('DD'),
      month: renewedDate.format('MM'),
      year: renewedDate.format('YYYY')
    })
    expect(() => renewalStartDateValidator(samplePayload, options)).toThrow()
  })

  it('throws an error for a licence starting more than 30 days hence', () => {
    const renewedDate = moment().add(31, 'days')
    const samplePayload = getSamplePayload({
      day: renewedDate.format('DD'),
      month: renewedDate.format('MM'),
      year: renewedDate.format('YYYY')
    })
    expect(() => renewalStartDateValidator(samplePayload, options)).toThrow()
  })

  it('validates for a date within the next 30 days', () => {
    const renewedDate = moment().add(4, 'days')
    const samplePayload = getSamplePayload({
      day: renewedDate.format('DD'),
      month: renewedDate.format('MM'),
      year: renewedDate.format('YYYY')
    })
    expect(() => renewalStartDateValidator(samplePayload, options)).not.toThrow()
  })

  it.each([
    ['01', '03', '1994'],
    ['10', '12', '2004']
  ])('passes start date day (%s), month (%s) and year (%s) to dateSchemaInput', (day, month, year) => {
    setupMocks()
    renewalStartDateValidator(getSamplePayload({ day, month, year }), options)
    expect(dateSchema.dateSchemaInput).toHaveBeenCalledWith(day, month, year)
    tearDownMocks()
  })

  it('passes dateSchemaInput output and dateSchema to Joi.assert', () => {
    setupMocks()
    const dsi = Symbol('dsi')
    dateSchema.dateSchemaInput.mockReturnValueOnce(dsi)
    renewalStartDateValidator(getSamplePayload(), options)
    expect(Joi.assert).toHaveBeenCalledWith(dsi, dateSchema.dateSchema)
    tearDownMocks()
  })

  it('passes validation if licence is set to start after payment', () => {
    const samplePayload = getSamplePayload({
      day: moment().format('DD'),
      month: moment().format('MM'),
      year: moment().format('YYYY')
    })
    expect(() => renewalStartDateValidator(samplePayload, options)).not.toThrow()
  })

  it('throws an error if licence-to-start is set to an invalid value', () => {
    const samplePayload = { 'licence-to-start': '12th-of-never' }
    expect(() => renewalStartDateValidator(samplePayload, options)).toThrow()
  })
})

describe('getDobErrorMessage', () => {
  const getMockCatalog = () => ({
    dob_error: 'Enter your date of birth',
    dob_error_missing_day_and_month: 'Enter the day and month',
    dob_error_missing_day_and_year: 'Enter the day and year',
    dob_error_missing_month_and_year: 'Enter the month and year',
    dob_error_missing_day: 'Enter the day',
    dob_error_missing_month: 'Enter the month',
    dob_error_missing_year: 'Enter the year',
    dob_error_non_numeric: 'Date of birth must be numbers',
    dob_error_date_real: 'Enter a real date',
    dob_error_year_min: 'Year is too far in the past',
    dob_error_year_max: 'Year is too recent'
  })

  it('returns undefined when no matching error is present', () => {
    const result = getDobErrorMessage({}, getMockCatalog())
    expect(result).toBeUndefined()
  })

  it('returns the mapped message for a simple field error', () => {
    const catalog = getMockCatalog()
    const error = { day: 'any.required' }
    const result = getDobErrorMessage(error, catalog)
    expect(result).toEqual({ text: catalog.dob_error_missing_day })
  })

  it('returns undefined when error payload is missing', () => {
    const catalog = getMockCatalog()
    const result = getDobErrorMessage(undefined, catalog)
    expect(result).toBeUndefined()
  })

  it('returns the mapped message for a date-range minimum error', () => {
    const catalog = getMockCatalog()
    const error = { 'date-range': 'date.min' }
    const result = getDobErrorMessage(error, catalog)
    expect(result).toEqual({ text: catalog.dob_error_year_min })
  })

  it('returns the mapped message for a date-range maximum error', () => {
    const catalog = getMockCatalog()
    const error = { 'date-range': 'date.max' }
    const result = getDobErrorMessage(error, catalog)
    expect(result).toEqual({ text: catalog.dob_error_year_max })
  })

  it('returns undefined when catalog is missing', () => {
    const error = { day: 'any.required' }
    expect(getDobErrorMessage(error)).toBeUndefined()
  })
})
