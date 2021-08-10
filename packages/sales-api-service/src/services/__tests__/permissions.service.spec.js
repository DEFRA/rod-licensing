import { generatePermissionNumber, calculateEndDate, generate, logStartDateError } from '../permissions.service.js'
import moment from 'moment'
import {
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_12MONTH_DISABLED_PERMIT,
  MOCK_1DAY_FULL_PERMIT_ENTITY,
  MOCK_CONCESSION
} from '../../__mocks__/test-data.js'
import { JUNIOR_MAX_AGE, SENIOR_MIN_AGE } from '@defra-fish/business-rules-lib'

jest.mock('../reference-data.service.js', () => ({
  ...jest.requireActual('../reference-data.service.js'),
  getReferenceDataForEntityAndId: async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_SENIOR_PERMIT.constructor) {
      for (const permit of [
        MOCK_12MONTH_DISABLED_PERMIT,
        MOCK_12MONTH_SENIOR_PERMIT,
        MOCK_1DAY_SENIOR_PERMIT_ENTITY,
        MOCK_1DAY_FULL_PERMIT_ENTITY
      ]) {
        if (permit.id === id) {
          return permit
        }
      }
      return null
    } else if (entityType === MOCK_CONCESSION.constructor) {
      item = MOCK_CONCESSION
    }
    return item
  }
}))
const consoleError = console.error

describe('permissions service', () => {
  beforeEach(jest.clearAllMocks)

  describe('generatePermissionNumber', () => {
    it('generates a permission number for adults', async () => {
      const now = moment()
      const number = await generatePermissionNumber(
        {
          permitId: MOCK_12MONTH_DISABLED_PERMIT.id,
          issueDate: now.toISOString(),
          startDate: now.toISOString(),
          licensee: {
            firstName: 'Fester',
            lastName: 'Tester',
            birthDate: moment(now)
              .subtract(JUNIOR_MAX_AGE, 'years')
              .format('YYYY-MM-DD')
          }
        },
        'Telesales'
      )
      const block1 = moment(now)
        .add(1, 'hour')
        .startOf('hour')
        .add(1, 'year')
        .format('HHDDMMYY')
      const expected = new RegExp(`^${block1}-1TS3FFT-[A-Z0-9]{5}[0-9]$`)
      expect(number).toMatch(expected)
    })

    it('generates a permission number for juniors', async () => {
      const now = moment()
      const number = await generatePermissionNumber(
        {
          permitId: MOCK_1DAY_FULL_PERMIT_ENTITY.id,
          issueDate: now.toISOString(),
          startDate: now.toISOString(),
          licensee: {
            firstName: 'Fester',
            lastName: 'Tester',
            birthDate: moment(now)
              .subtract(JUNIOR_MAX_AGE - 1, 'years')
              .format('YYYY-MM-DD')
          }
        },
        'Web Sales'
      )
      const block1 = moment(now)
        .add(1, 'hour')
        .startOf('hour')
        .add(1, 'day')
        .format('HHDDMMYY')
      const expected = new RegExp(`^${block1}-2WC1JFT-[A-Z0-9]{5}[0-9]$`)
      expect(number).toMatch(expected)
    })

    it('generates a permission number for seniors', async () => {
      const now = moment()
      const number = await generatePermissionNumber(
        {
          permitId: MOCK_1DAY_FULL_PERMIT_ENTITY.id,
          issueDate: now.toISOString(),
          startDate: now.toISOString(),
          licensee: {
            firstName: 'Fester',
            lastName: 'Tester',
            birthDate: moment(now)
              .subtract(SENIOR_MIN_AGE, 'years')
              .format('YYYY-MM-DD')
          }
        },
        'Web Sales'
      )
      const block1 = moment(now)
        .add(1, 'hour')
        .startOf('hour')
        .add(1, 'day')
        .format('HHDDMMYY')
      const expected = new RegExp(`^${block1}-2WC1SFT-[A-Z0-9]{5}[0-9]$`)
      expect(number).toMatch(expected)
    })
  })

  describe('calculateEndDate', () => {
    it('calculates 365 days for 1 year licences outside of a leap year', async () => {
      const startDate = moment('2019-01-01')
      const endDate = await calculateEndDate({ permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190', startDate: startDate })
      expect(endDate).toEqual(
        moment(startDate)
          .add(365, 'days')
          .toISOString()
      )
    })
    it('calculates 366 days for 1 year licences in a leap year', async () => {
      const startDate = moment('2020-01-01')
      const endDate = await calculateEndDate({ permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190', startDate: startDate })
      expect(endDate).toEqual(
        moment(startDate)
          .add(366, 'days')
          .toISOString()
      )
    })
  })

  describe('sequence generator', () => {
    it('generates a rolling sequence', () => {
      const results = []
      for (let i = 0; i < 12; i++) {
        results.push(generate(i, ['AB', '123']))
      }
      expect(results).toEqual(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3'])
    })
  })

  describe('logStartDateError', () => {
    beforeAll(() => {
      console.error = jest.fn()
    })
    afterAll(() => {
      console.error = consoleError
    })

    it('logs if start date is before issue date', () => {
      const samplePermission = {
        startDate: '2021-08-10T04:05:54Z',
        issueDate: '2021-08-10T14:05:54Z'
      }
      logStartDateError(samplePermission)
      expect(console.error).toHaveBeenCalled()
    })

    it('logs if start date is before current time, if no issue date is provided', () => {
      const samplePermission = {
        startDate: moment().subtract(5, 'hours').toISOString()
      }
      logStartDateError(samplePermission)
      expect(console.error).toHaveBeenCalled()
    })

    it('doesn\'t log if start date is after issue date', () => {
      const samplePermission = {
        startDate: '2021-08-10T14:35:54Z',
        issueDate: '2021-08-10T14:05:54Z'
      }
      logStartDateError(samplePermission)
      expect(console.error).not.toHaveBeenCalled()
    })

    it('doesn\'t log if start date is after current date', () => {
      const samplePermission = {
        startDate: moment().add(30, 'minutes').toISOString()
      }
      logStartDateError(samplePermission)
      expect(console.error).not.toHaveBeenCalled()
    })
  })
})
