import Joi from 'joi'
import { getData, validator } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { LICENCE_FOR } from '../../../../uri.js'
import moment from 'moment'
const dateSchema = require('../../../../schema/date.schema.js')

jest.mock('../../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../../routes/page-route.js')

describe('name > route', () => {
  const mockRequest = (statusGet = () => {}, transactionGet = () => {}) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: transactionGet
        },
        status: {
          getCurrentPermission: statusGet
        }
      }
    })
  })

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const transaction = () => ({
        isLicenceForYou: true
      })
      const status = () => ({
        [LICENCE_FOR.page]: true
      })
      const result = await getData(mockRequest(status, transaction))
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const transaction = () => ({
        isLicenceForYou: false
      })
      const status = () => ({
        [LICENCE_FOR.page]: true
      })
      const result = await getData(mockRequest(status, transaction))
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })

  describe('redirectToStartOfJourney', () => {
    it('should throw a redirect if not been to LICENCE_FOR page', async () => {
      const transaction = () => ({
        isLicenceForYou: true
      })
      const status = () => ({
        [LICENCE_FOR.page]: false
      })
      const func = () => getData(mockRequest(status, transaction))
      await expect(func).rejects.toThrowRedirectTo(LICENCE_FOR.uri)
    })

    it('should not throw a redirect if not been to LICENCE_FOR page', async () => {
      const transaction = () => ({
        isLicenceForYou: true
      })
      const status = () => ({
        [LICENCE_FOR.page]: true
      })

      let error

      try {
        await getData(mockRequest(status, transaction))
      } catch (e) {
        error = e
      }

      expect(error).toBeUndefined()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with date-of-birth, /buy/date-of-birth, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('date-of-birth', '/buy/date-of-birth', validator, nextPage, getData)
    })
  })

  describe('validation', () => {
    beforeEach(jest.clearAllMocks)

    const getSamplePayload = ({ day = '', month = '', year = '' } = {}) => ({
      'date-of-birth-day': day,
      'date-of-birth-month': month,
      'date-of-birth-year': year
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

    it('throws an error for anyone over 120 years old', () => {
      const invalidDoB = moment().subtract(120, 'years').subtract(1, 'day')
      const samplePayload = getSamplePayload({
        day: invalidDoB.format('DD'),
        month: invalidDoB.format('MM'),
        year: invalidDoB.format('YYYY')
      })
      expect(() => validator(samplePayload)).toThrow()
    })

    it('validates for anyone 120 years old', () => {
      const validDoB = moment().subtract(120, 'years')
      const samplePayload = getSamplePayload({
        day: validDoB.format('DD'),
        month: validDoB.format('MM'),
        year: validDoB.format('YYYY')
      })
      expect(() => validator(samplePayload)).not.toThrow()
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
      expect(() => validator(samplePayload)).toThrow()
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
      expect(() => validator(samplePayload)).not.toThrow()
    })

    it.each([
      ['01', '03', '1994'],
      ['10', '12', '2004']
    ])('passes date of birth day (%s), month (%s) and year (%s) to dateSchemaInput', (day, month, year) => {
      setupMocks()
      validator(getSamplePayload({ day, month, year }))
      expect(dateSchema.dateSchemaInput).toHaveBeenCalledWith(day, month, year)
      tearDownMocks()
    })

    it('passes dateSchemaInput output and dateSchema  to Joi.assert', () => {
      setupMocks()
      const dsi = Symbol('dsi')
      dateSchema.dateSchemaInput.mockReturnValueOnce(dsi)
      validator(getSamplePayload())
      expect(Joi.assert).toHaveBeenCalledWith(dsi, dateSchema.dateSchema)
      tearDownMocks()
    })
  })
})
