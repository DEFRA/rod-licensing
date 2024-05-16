import moment from 'moment'
import { prepareContactMethodData, prepareDateData } from '../renewals.service.js'

describe('prepareContactMethodData', () => {
  it('should copy the relevant data', async () => {
    const existingPermission = {
      licensee: {
        preferredMethodOfNewsletter: {
          label: 'Email'
        },
        preferredMethodOfConfirmation: {
          label: 'Text'
        },
        preferredMethodOfReminder: {
          label: 'Letter'
        }
      }
    }
    const expectedData = {
      preferredMethodOfNewsletter: 'Email',
      preferredMethodOfConfirmation: 'Text',
      preferredMethodOfReminder: 'Letter'
    }
    expect(prepareContactMethodData(existingPermission)).toEqual(expectedData)
  })
})

describe('prepareDateData', () => {
  describe('when the original permission has expired', () => {
    it('should process the data correctly', async () => {
      const endDate = moment().subtract(5, 'days')
      const existingPermission = {
        endDate
      }
      const expectedData = {
        renewedHasExpired: true,
        licenceToStart: 'after-payment',
        licenceStartDate: moment().format('YYYY-MM-DD'),
        licenceStartTime: 0,
        renewedEndDate: endDate.toISOString()
      }
      expect(prepareDateData(existingPermission)).toEqual(expectedData)
    })
  })

  describe('when the original permission has not expired', () => {
    it('should process the data correctly', async () => {
      const endDate = moment().add(5, 'days')
      const existingPermission = {
        endDate
      }
      const expectedData = {
        renewedHasExpired: false,
        licenceToStart: 'another-date',
        licenceStartDate: endDate.format('YYYY-MM-DD'),
        licenceStartTime: endDate.hours(),
        renewedEndDate: endDate.toISOString()
      }
      expect(prepareDateData(existingPermission)).toEqual(expectedData)
    })
  })
})
