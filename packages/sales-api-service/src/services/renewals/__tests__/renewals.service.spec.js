import moment from 'moment'
import { preparePermissionDataForRenewal } from '../renewals.service.js'

describe('preparePermissionDataForRenewal', () => {
  const existingPermission = overrides => ({
    licensee: {
      birthDate: '1991-01-01',
      country: {
        label: 'England',
        description: 'GB-ENG'
      },
      email: 'email@example.com',
      firstName: 'Sally',
      lastName: 'Salmon',
      mobilePhone: null,
      postalFulfilment: false,
      postcode: 'TE1 1ST',
      street: 'Angler Street',
      town: 'Fishville',
      preferredMethodOfNewsletter: {
        label: 'Email'
      },
      preferredMethodOfConfirmation: {
        label: 'Text'
      },
      preferredMethodOfReminder: {
        label: 'Letter'
      },
      shortTermPreferredMethodOfConfirmation: {
        label: 'Text'
      }
    },
    permit: {
      id: '123456',
      permitSubtype: {
        label: 'Salmon and sea trout'
      },
      numberOfRods: 1
    },
    ...overrides
  })

  it('should assign the correct data to the base permission', async () => {
    const expectedData = {
      isRenewal: true,
      licenceLength: '12M',
      licenceType: 'Salmon and sea trout',
      numberOfRods: '1',
      isLicenceForYou: true,
      permitId: '123456'
    }
    expect(preparePermissionDataForRenewal(existingPermission())).toEqual(expect.objectContaining(expectedData))
  })

  it('should copy the relevant licensee data', async () => {
    const expectedData = {
      birthDate: '1991-01-01',
      country: 'England',
      countryCode: 'GB-ENG',
      email: 'email@example.com',
      firstName: 'Sally',
      lastName: 'Salmon',
      postcode: 'TE1 1ST',
      street: 'Angler Street',
      town: 'Fishville',
      preferredMethodOfNewsletter: 'Email',
      preferredMethodOfConfirmation: 'Text',
      preferredMethodOfReminder: 'Letter'
    }
    expect(preparePermissionDataForRenewal(existingPermission()).licensee).toEqual(expect.objectContaining(expectedData))
  })

  it('should not assign shortTermPreferredMethodOfConfirmation to the licensee', async () => {
    const licenseeData = preparePermissionDataForRenewal(existingPermission()).licensee
    expect(licenseeData.shortTermPreferredMethodOfConfirmation).toBeUndefined()
  })

  it('should remove null values from the licensee object', async () => {
    expect(preparePermissionDataForRenewal(existingPermission()).licensee).toEqual(expect.not.objectContaining({ mobilePhone: null }))
  })

  it('should keep false values on the licensee object', async () => {
    expect(preparePermissionDataForRenewal(existingPermission()).licensee).toEqual(expect.objectContaining({ postalFulfilment: false }))
  })

  describe('when the original permission has expired', () => {
    it('should process the data correctly', async () => {
      const endDate = moment().subtract(5, 'days')
      const expectedData = {
        renewedHasExpired: true,
        licenceToStart: 'after-payment',
        licenceStartDate: moment().format('YYYY-MM-DD'),
        licenceStartTime: 0,
        renewedEndDate: endDate.toISOString()
      }
      expect(preparePermissionDataForRenewal(existingPermission({ endDate }))).toEqual(expect.objectContaining(expectedData))
    })
  })

  describe('when the original permission has not expired', () => {
    it('should process the data correctly', async () => {
      const endDate = moment().add(5, 'days')
      const expectedData = {
        renewedHasExpired: false,
        licenceToStart: 'another-date',
        licenceStartDate: endDate.format('YYYY-MM-DD'),
        licenceStartTime: endDate.hours(),
        renewedEndDate: endDate.toISOString()
      }
      expect(preparePermissionDataForRenewal(existingPermission({ endDate }))).toEqual(expect.objectContaining(expectedData))
    })
  })
})
