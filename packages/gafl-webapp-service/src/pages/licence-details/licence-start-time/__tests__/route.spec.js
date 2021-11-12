import startTimePageRoute from '../route.js'
import moment from 'moment-timezone'
import pageRoute from '../../../../routes/page-route.js'

jest.mock('../../../../routes/page-route.js')
jest.mock('moment-timezone')

describe('Licence start time data validation', () => {
  const validator = pageRoute.mock.calls[1][2]

  afterEach(() => jest.clearAllMocks)
  it.each([
    ['0', '2021-11-10', '2021-11-10T00:00:00.000Z'],
    ['1', '2021-11-10', '2021-11-10T01:31:00.000Z'],
    ['2', '2021-11-10', '2021-11-10T02:00:00.000Z'],
    ['3', '2021-11-10', '2021-11-10T02:31:00.000Z'],
    ['4', '2021-11-10', '2021-11-10T03:31:00.000Z'],
    ['5', '2021-11-10', '2021-11-10T04:31:00.000Z'],
    ['6', '2021-11-10', '2021-11-10T05:31:00.000Z'],
    ['7', '2021-11-10', '2021-11-10T06:31:00.000Z'],
    ['8', '2021-11-10', '2021-11-10T07:31:00.000Z'],
    ['9', '2021-11-10', '2021-11-10T08:31:00.000Z'],
    ['10', '2021-11-10', '2021-11-10T09:31:00.000Z'],
    ['11', '2021-11-10', '2021-11-10T10:31:00.000Z'],
    ['12', '2021-11-10', '2021-11-10T11:31:00.000Z'],
    ['13', '2021-11-10', '2021-11-10T12:31:00.000Z'],
    ['14', '2021-11-10', '2021-11-10T13:31:00.000Z'],
    ['15', '2021-11-10', '2021-11-10T14:31:00.000Z'],
    ['16', '2021-11-10', '2021-11-10T15:31:00.000Z'],
    ['17', '2021-11-10', '2021-11-10T16:31:00.000Z'],
    ['18', '2021-11-10', '2021-11-10T17:31:00.000Z'],
    ['19', '2021-11-10', '2021-11-10T18:31:00.000Z'],
    ['20', '2021-11-10', '2021-11-10T19:31:00.000Z'],
    ['21', '2021-11-10', '2021-11-10T20:31:00.000Z'],
    ['22', '2021-11-10', '2021-11-10T21:31:00.000Z'],
    ['23', '2021-11-10', '2021-11-10T22:31:00.000Z']
  ])('validation fails for start time of %s when permission date is %s and current date and time is %s', (hour, licenceStartDate, now) => {
    const realMoment = jest.requireActual('moment-timezone')
    moment.mockImplementation((date, format) => {
      if (date) {
        return realMoment(date, format)
      }
      return realMoment(now, format)
    })

    return expect(() =>
      validator(
        { 'licence-start-time': hour },
        getMockRequest(licenceStartDate)
      )
    ).rejects.toThrow()
  })

  it.each([
    ['0', '2021-11-10', '2021-11-09T23:29:00.000Z'],
    ['1', '2021-11-10', '2021-11-10T00:29:00.000Z'],
    ['2', '2021-11-10', '2021-11-10T01:29:00.000Z'],
    ['3', '2021-11-10', '2021-11-10T02:29:00.000Z'],
    ['4', '2021-11-10', '2021-11-10T03:29:00.000Z'],
    ['5', '2021-11-10', '2021-11-10T04:29:00.000Z'],
    ['6', '2021-11-10', '2021-11-10T05:29:00.000Z'],
    ['7', '2021-11-10', '2021-11-10T06:29:00.000Z'],
    ['8', '2021-11-10', '2021-11-10T07:29:00.000Z'],
    ['9', '2021-11-10', '2021-11-10T08:29:00.000Z'],
    ['10', '2021-11-10', '2021-11-10T09:29:00.000Z'],
    ['11', '2021-11-10', '2021-11-10T10:29:00.000Z'],
    ['12', '2021-11-10', '2021-11-10T11:29:00.000Z'],
    ['13', '2021-11-10', '2021-11-10T12:29:00.000Z'],
    ['14', '2021-11-10', '2021-11-10T13:29:00.000Z'],
    ['15', '2021-11-10', '2021-11-10T14:29:00.000Z'],
    ['16', '2021-11-10', '2021-11-10T15:29:00.000Z'],
    ['17', '2021-11-10', '2021-11-10T16:29:00.000Z'],
    ['18', '2021-11-10', '2021-11-10T17:29:00.000Z'],
    ['19', '2021-11-10', '2021-11-10T18:29:00.000Z'],
    ['20', '2021-11-10', '2021-11-10T19:29:00.000Z'],
    ['21', '2021-11-10', '2021-11-10T20:29:00.000Z'],
    ['22', '2021-11-10', '2021-11-10T21:29:00.000Z'],
    ['23', '2021-11-10', '2021-11-10T22:29:00.000Z']
  ])('validation succeeds for start time of %s when permission date is %s and current date and time is %s', (hour, licenceStartDate, now) => {
    const realMoment = jest.requireActual('moment-timezone')
    moment.mockImplementation((date, format) => {
      if (date) {
        return realMoment(date, format)
      }
      return realMoment(now, format)
    })

    return expect(
      validator(
        { 'licence-start-time': hour },
        getMockRequest(licenceStartDate)
      )
    ).resolves.toBeUndefined()
  })

  const getMockRequest = licenceStartDate => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: async () => ({
            licenceStartDate
          })
        }
      }
    })
  })
})

// payload {"licence-start-time":"18","continue":""}
// request permission
/*
    permission {
      licensee: { birthDate: '1987-10-12' },
      licenceToStart: 'another-date',
      licenceStartDate: '2021-11-09',
      licenceType: 'Trout and coarse',
      numberOfRods: '2',
      licenceLength: '1D',
      licenceStartTime: '18',
      permit: {
        id: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
        description: 'Coarse 1 day 2 Rod Licence (Full)',
        permitType: {
          id: 910400000,
          label: 'Rod Fishing Licence',
          description: 'Rod Fishing Licence'
        },
        permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
        durationMagnitude: 1,
        durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
        numberOfRods: 2,
        availableFrom: '2017-03-31T23:00:00.000Z',
        availableTo: '2037-03-31T23:59:00.000Z',
        isForFulfilment: false,
        isCounterSales: true,
        isRecurringPaymentSupported: false,
        cost: 6,
        itemId: '42289',
        concessions: []
      },
      hash: 'd3b0b22d3d2b617833a681542d56e3534529335bc5ebbe53feb19220b729cdbc'
    }
    */
