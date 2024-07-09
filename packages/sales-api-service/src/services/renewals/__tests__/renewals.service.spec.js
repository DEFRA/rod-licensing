import moment from 'moment'
import { preparePermissionDataForRenewal } from '../renewals.service.js'
import { findPermit } from '../../permit-service.js'
import { salesApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib')

const mockConcessions = [
  {
    id: '3230c68f-ef65-e611-80dc-c4346bad4004',
    name: 'Junior'
  },
  {
    id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
    name: 'Senior'
  },
  {
    id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
    name: 'Disabled'
  }
]

salesApi.concessions.getAll.mockResolvedValue(mockConcessions)
const mockPermit = { id: '123456' }

jest.mock('../../permit-service.js', () => ({
  findPermit: jest.fn(() => mockPermit)
}))

findPermit.mockReturnValue({ id: '123456' })

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
      },
      noLicenceRequired: true
    },
    permit: {
      id: '123456',
      permitSubtype: {
        label: 'Salmon and sea trout'
      },
      numberOfRods: 1
    },
    concessions: [],
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
    expect(await preparePermissionDataForRenewal(existingPermission())).toEqual(expect.objectContaining(expectedData))
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
    const permission = await preparePermissionDataForRenewal(existingPermission())
    expect(permission.licensee).toEqual(expect.objectContaining(expectedData))
  })

  it('should not assign shortTermPreferredMethodOfConfirmation to the licensee', async () => {
    const permission = await preparePermissionDataForRenewal(existingPermission())
    expect(permission.licensee.shortTermPreferredMethodOfConfirmation).toBeUndefined()
  })

  it('should remove null values from the licensee object', async () => {
    const permission = await preparePermissionDataForRenewal(existingPermission())
    expect(permission.licensee).toEqual(expect.not.objectContaining({ mobilePhone: null }))
  })

  it('should keep false values on the licensee object', async () => {
    const permission = await preparePermissionDataForRenewal(existingPermission())
    expect(permission.licensee).toEqual(expect.objectContaining({ postalFulfilment: false }))
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
      expect(await preparePermissionDataForRenewal(existingPermission({ endDate }))).toEqual(expect.objectContaining(expectedData))
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
      expect(await preparePermissionDataForRenewal(existingPermission({ endDate }))).toEqual(expect.objectContaining(expectedData))
    })
  })

  describe('prepareConcessionsData', () => {
    it('should add senior concession if the licensee is senior', async () => {
      const licensee = {
        birthDate: '1954-01-01',
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
      }
      const permission = await preparePermissionDataForRenewal(existingPermission({ licensee }))
      const senior = { type: 'Senior', proof: { type: 'No Proof' } }
      expect(permission.concessions[0]).toEqual(senior)
    })

    it('should remove senior concession if the licensee is not senior', async () => {
      const permission = await preparePermissionDataForRenewal(existingPermission())
      expect(permission.concessions).toEqual([])
    })

    it('should remove noLicenceRequired from licensee', async () => {
      const permission = await preparePermissionDataForRenewal(existingPermission())
      expect(permission.licensee.noLicenceRequired).toBeUndefined()
    })
  })

  describe('preparePermit', () => {
    it('permitId should match the return of findPermit.id', async () => {
      const mockPermit = {
        id: '101010',
        permitSubtype: {
          label: 'Salmon and sea trout'
        },
        numberOfRods: 1
      }
      findPermit.mockResolvedValueOnce(mockPermit)
      const permission = await preparePermissionDataForRenewal(existingPermission())
      expect(permission.permitId).toEqual(mockPermit.id)
    })
  })
})
