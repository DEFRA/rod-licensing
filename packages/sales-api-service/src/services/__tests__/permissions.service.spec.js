import { generatePermissionNumber, calculateEndDate } from '../permissions.service.js'
import moment from 'moment'
import { Permit } from '@defra-fish/dynamics-lib'
const MockPermit = Permit
jest.mock('../reference-data.service.js', () => ({
  ...jest.requireActual('../reference-data.service.js'),
  getReferenceDataForId: jest.fn(async (entityType, id) => {
    const optionSetData = await jest
      .requireActual('@defra-fish/dynamics-lib')
      .retrieveGlobalOptionSets()
      .cached()
    let permit
    if (id === 'e11b34a0-0c66-e611-80dc-c4346bad0190') {
      permit = MockPermit.fromResponse(
        {
          '@odata.etag': 'W/"51026198"',
          defra_availablefrom: '2017-03-31T23:00:00Z',
          defra_availableto: '2021-03-31T22:59:00Z',
          defra_durationnumericpart: 12,
          defra_durationdaymonthyearpart: 910400001,
          defra_numberofrods: 1,
          defra_duration: 910400003,
          defra_permittype: 910400000,
          defra_advertisedprice: 54.0,
          defra_datasource: 910400002,
          defra_permitid: 'e11b34a0-0c66-e611-80dc-c4346bad0190',
          defra_name: 'Salmon 12 month 1 Rod Licence (Full, Disabled)',
          defra_permitsubtype: 910400000,
          defra_equipment: 910400003,
          defra_isforfulfilment: true,
          defra_iscountersales: true,
          defra_advertisedprice_base: 54.0,
          defra_itemid: '42376'
        },
        optionSetData
      )
    } else {
      permit = MockPermit.fromResponse(
        {
          '@odata.etag': 'W/"22639016"',
          defra_availablefrom: '2017-03-31T23:00:00Z',
          defra_availableto: '2020-03-31T22:59:00Z',
          defra_duration: 910400000,
          defra_durationnumericpart: 1,
          defra_durationdaymonthyearpart: 910400000,
          defra_permittype: 910400000,
          defra_advertisedprice: 6.0,
          defra_permitid: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
          defra_name: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
          defra_permitsubtype: 910400000,
          defra_equipment: 910400000,
          defra_numberofrods: 2,
          defra_isforfulfilment: false,
          defra_iscountersales: true,
          defra_advertisedprice_base: 6.0,
          defra_itemid: '42289'
        },
        optionSetData
      )
    }
    return permit
  })
}))

// TODO: Extend tests
describe('permissions service', () => {
  describe('generatePermissionNumber', () => {
    it('generates a permission number for adults', async () => {
      const now = moment()
      const number = await generatePermissionNumber(
        {
          permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190',
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
      const expected = new RegExp(`^${block1}-1TS1FFT-[A-HJ-NP-Z0-9]{6}$`)
      expect(number).toMatch(expected)
    })

    it('generates a permission number for juniors', async () => {
      const now = moment()
      const number = await generatePermissionNumber(
        {
          permitId: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
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
          permitId: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
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
