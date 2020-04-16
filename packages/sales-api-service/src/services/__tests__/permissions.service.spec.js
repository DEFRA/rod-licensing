import { generatePermissionNumber, calculateEndDate } from '../permissions.service.js'
import moment from 'moment'
import {
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_1DAY_SENIOR_PERMIT,
  MOCK_12MONTH_DISABLED_PERMIT,
  MOCK_1DAY_FULL_PERMIT,
  MOCK_CONCESSION
} from '../../../__mocks__/test-data.js'

jest.mock('../reference-data.service.js', () => ({
  ...jest.requireActual('../reference-data.service.js'),
  getReferenceDataForEntityAndId: async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_SENIOR_PERMIT.constructor) {
      for (const permit of [MOCK_12MONTH_DISABLED_PERMIT, MOCK_12MONTH_SENIOR_PERMIT, MOCK_1DAY_SENIOR_PERMIT, MOCK_1DAY_FULL_PERMIT]) {
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

describe('permissions service', () => {
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
              .subtract(16, 'years')
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
      const expected = new RegExp(`^${block1}-1TS3FFT-[A-HJ-NP-Z0-9]{6}$`)
      expect(number).toMatch(expected)
    })

    it('generates a permission number for juniors', async () => {
      const now = moment()
      const number = await generatePermissionNumber(
        {
          permitId: MOCK_1DAY_FULL_PERMIT.id,
          issueDate: now.toISOString(),
          startDate: now.toISOString(),
          licensee: {
            firstName: 'Fester',
            lastName: 'Tester',
            birthDate: moment(now)
              .subtract(15, 'years')
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
      const expected = new RegExp(`^${block1}-2WS1JFT-[A-HJ-NP-Z0-9]{6}$`)
      expect(number).toMatch(expected)
    })

    it('generates a permission number for seniors', async () => {
      const now = moment()
      const number = await generatePermissionNumber(
        {
          permitId: MOCK_1DAY_FULL_PERMIT.id,
          issueDate: now.toISOString(),
          startDate: now.toISOString(),
          licensee: {
            firstName: 'Fester',
            lastName: 'Tester',
            birthDate: moment(now)
              .subtract(65, 'years')
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
      const expected = new RegExp(`^${block1}-2WS1SFT-[A-HJ-NP-Z0-9]{6}$`)
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
})
