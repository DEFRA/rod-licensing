import Joi from 'joi'
import { getData, validator } from '../route'
import moment from 'moment'
const dateSchema = require('../../../../schema/date.schema.js')

jest.mock('../../../../processors/uri-helper.js')

describe('licence-to-start > route', () => {
  const getMockRequest = (isLicenceForYou = true) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => ({
            isLicenceForYou
          })
        }
      }
    })
  })

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const request = getMockRequest()
      const result = await getData(request)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const request = getMockRequest(false)
      const result = await getData(request)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })

  describe('validation', () => {
    beforeEach(jest.clearAllMocks)

    const getSamplePayload = ({ day = '', month = '', year = '' } = {}) => ({
      'licence-start-date-day': day,
      'licence-start-date-month': month,
      'licence-start-date-year': year,
      'licence-to-start': 'another-date'
    })

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

    it('throws an error for a licence starting before today', () => {
      const invalidStartDate = moment().subtract(1, 'day')
      const samplePayload = getSamplePayload({
        day: invalidStartDate.format('DD'),
        month: invalidStartDate.format('MM'),
        year: invalidStartDate.format('YYYY')
      })
      expect(() => validator(samplePayload)).toThrow()
    })

    it('throws an error for a licence starting more than 30 days hence', () => {
      const invalidStartDate = moment().add(31, 'days')
      const samplePayload = getSamplePayload({
        day: invalidStartDate.format('DD'),
        month: invalidStartDate.format('MM'),
        year: invalidStartDate.format('YYYY')
      })
      expect(() => validator(samplePayload)).toThrow()
    })

    it('validates for a date within the next 30 days', () => {
      const validStartDate = moment().add(4, 'days')
      const samplePayload = getSamplePayload({
        day: validStartDate.format('DD'),
        month: validStartDate.format('MM'),
        year: validStartDate.format('YYYY')
      })
      expect(() => validator(samplePayload)).not.toThrow()
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
      expect(() => validator(samplePayload)).not.toThrow()
      jest.useRealTimers()
    })

    it.each([
      ['01', '03', '1994'],
      ['10', '12', '2004']
    ])('passes start date day (%s), month (%s) and year (%s) to dateSchemaInput', (day, month, year) => {
      setupMocks()
      validator(getSamplePayload({ day, month, year }))
      expect(dateSchema.dateSchemaInput).toHaveBeenCalledWith(day, month, year)
      tearDownMocks()
    })

    it('passes dateSchemaInput output and dateSchema to Joi.assert', () => {
      setupMocks()
      const dsi = Symbol('dsi')
      dateSchema.dateSchemaInput.mockReturnValueOnce(dsi)
      validator(getSamplePayload())
      expect(Joi.assert).toHaveBeenCalledWith(dsi, dateSchema.dateSchema)
      tearDownMocks()
    })

    it('passes validation if licence is set to start after payment', () => {
      const samplePayload = { 'licence-to-start': 'after-payment' }
      expect(() => validator(samplePayload)).not.toThrow()
    })

    it('throws an error if licence-to-start is set to an invalid value', () => {
      const samplePayload = { 'licence-to-start': '12th-of-never' }
      expect(() => validator(samplePayload)).toThrow()
    })
  })
})
