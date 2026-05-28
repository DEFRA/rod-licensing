import moment from 'moment'
import { preparePermissionDataForRenewal } from '../renewals.service.js'
import { findPermit } from '../../permit.service.js'
import { getReferenceDataForEntity } from '../../reference-data.service.js'
import { CONCESSION, CONCESSION_PROOF } from '../../constants.js'

jest.mock('@defra-fish/connectors-lib')
jest.mock('../../reference-data.service.js')

getReferenceDataForEntity.mockResolvedValue([
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
])

jest.mock('../../permit.service.js', () => ({
  findPermit: jest.fn(() => ({ id: '123456' }))
}))

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
    concessions: [],
    ...overrides
  })

  const existingSeniorPermission = () =>
    existingPermission({
      licensee: {
        ...existingPermission().licensee,
        birthDate: '1958-01-01'
      }
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
      const samplePermission = existingSeniorPermission()
      const ppd = await preparePermissionDataForRenewal(samplePermission)
      const senior = { name: 'Senior', id: 'd0ece997-ef65-e611-80dc-c4346bad4004', proof: { type: 'No Proof' } }
      expect(ppd.concessions[0]).toEqual(senior)
    })

    it("doesn't add senior concession if the licensee is not senior", async () => {
      const permission = await preparePermissionDataForRenewal(existingPermission())
      expect(permission.concessions).toEqual([])
    })

    it.each([
      ['1960-09-01', 'turns 66 in < 6 months'],
      ['1960-05-13', 'turns 66 the day after licence start'],
      ['1960-12-25', 'turns 66 in > 6 months']
    ])("doesn't add senior concession if the licensee is 65 at licence start (DOB: %s, %s)", async birthDate => {
      jest.useFakeTimers().setSystemTime(new Date('2026-04-01'))
      const endDate = moment('2026-05-11')
      const almostSeniorPermission = existingPermission({
        endDate,
        licensee: {
          ...existingPermission().licensee,
          birthDate
        }
      })
      const permission = await preparePermissionDataForRenewal(almostSeniorPermission)
      expect(permission.concessions).toEqual([])
      jest.useRealTimers()
    })

    it('should remove noLicenceRequired from licensee', async () => {
      const permission = existingPermission()
      permission.licensee.noLicenceRequired = true
      const preparedPermission = await preparePermissionDataForRenewal(existingPermission())
      expect(preparedPermission.licensee.noLicenceRequired).toBeUndefined()
    })

    it.each([
      ['adult', existingPermission()],
      ['senior', existingSeniorPermission()]
    ])('should leave disabled concession unmodified on %s permission', async (_d, permission) => {
      const disabledConcession = {
        id: 'eee-555-fff-666',
        name: CONCESSION.DISABLED,
        proof: {
          type: CONCESSION_PROOF.blueBadge,
          referenceNumber: 'blue-badge-123'
        }
      }
      permission.concessions = [disabledConcession]

      const preparedPermission = await preparePermissionDataForRenewal(permission)
      expect(preparedPermission.concessions).toEqual(expect.arrayContaining([expect.objectContaining(disabledConcession)]))
    })
  })

  describe('junior to adult transition', () => {
    describe.each`
      description                                                                                            | birthDate       | oldEndDate
      ${'the user is renewing at age 14 with a licence that will expire while they are 14'}                  | ${'2012-01-01'} | ${'2026-04-15'}
      ${'the user is renewing at age 14 with a licence that expires today'}                                  | ${'2012-01-01'} | ${'2026-04-01'}
      ${'the user is renewing at age 14 with a licence that expired while they were 14'}                     | ${'2012-01-01'} | ${'2026-03-31'}
      ${'the user is renewing at age 16 with a licence that will expire while they are 16'}                  | ${'2010-01-01'} | ${'2026-04-15'}
      ${'the user is renewing at age 16 with a licence that expires today'}                                  | ${'2010-01-01'} | ${'2026-04-01'}
      ${'the user is renewing at age 16 with a licence that expired while they were 16'}                     | ${'2010-01-01'} | ${'2026-03-31'}
      ${'the user is renewing the day before their 17th birthday with a licence that expired yesterday'}     | ${'2009-04-02'} | ${'2026-03-31'}
      ${'the user is renewing the day before their 17th birthday with a licence that expires today'}         | ${'2009-04-02'} | ${'2026-04-01'}
      ${'the user is renewing at age 16 with a licence that will expire the day before their 17th birthday'} | ${'2009-04-02'} | ${'2026-04-01'}
    `('expected junior licenses', ({ description, birthDate, oldEndDate }) => {
      it(`should issue a junior licence if ${description}`, async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-04-01'))
        const endDate = moment(oldEndDate)
        const junior = { name: 'Junior', id: '3230c68f-ef65-e611-80dc-c4346bad4004', proof: { type: 'No Proof' } }
        const stillJuniorPermission = existingPermission({
          endDate,
          licensee: {
            ...existingPermission().licensee,
            birthDate
          },
          concessions: [junior]
        })

        const ppd = await preparePermissionDataForRenewal(stillJuniorPermission)
        expect(ppd.concessions[0]).toEqual(junior)
        jest.useRealTimers()
      })

      it(`should issue a junior disabled licence if ${description} and the user has an existing disability concession`, async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-04-01'))
        const endDate = moment(oldEndDate)
        const junior = { name: 'Junior', id: '3230c68f-ef65-e611-80dc-c4346bad4004', proof: { type: 'No Proof' } }
        const disabled = {
          name: 'Disabled',
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          proof: { type: 'Blue Badge', referenceNumber: '123' }
        }
        const stillJuniorPermission = existingPermission({
          endDate,
          licensee: {
            ...existingPermission().licensee,
            birthDate
          },
          concessions: [junior, disabled]
        })

        const ppd = await preparePermissionDataForRenewal(stillJuniorPermission)
        expect(ppd.concessions).toEqual([junior, disabled])
        jest.useRealTimers()
      })
    })

    describe.each`
      description                                                                                                      | birthDate       | oldEndDate
      ${'the user is renewing at age 16 with a licence that will expire on their 17th birthday'}                       | ${'2009-04-10'} | ${'2026-04-10'}
      ${'the user is renewing at age 16 with a licence that will expire the day after their 17th birthday'}            | ${'2009-04-10'} | ${'2026-04-11'}
      ${'the user is renewing on the day of their 17th birthday a licence that expired yesterday'}                     | ${'2009-04-01'} | ${'2026-03-31'}
      ${'the user is renewing on the day of their 17th birthday a licence that expires today'}                         | ${'2009-04-01'} | ${'2026-04-01'}
      ${'the user is renewing on the day of their 17th birthday with a licence that expired a week ago'}               | ${'2009-04-01'} | ${'2026-03-25'}
      ${'the user is renewing the day after their 17th birthday a licence that expired the day before their birthday'} | ${'2009-03-31'} | ${'2026-03-30'}
      ${'the user is renewing the day after their 17th birthday a licence that expired on their birthday'}             | ${'2009-03-31'} | ${'2026-03-31'}
      ${'the user is renewing the day after their 17th birthday a licence that expires today'}                         | ${'2009-03-31'} | ${'2026-04-01'}
      ${'the user is renewing the day after their 17th birthday with a licence that expired a week ago'}               | ${'2009-03-31'} | ${'2026-03-25'}
    `('expected junior licenses', ({ description, birthDate, oldEndDate }) => {
      it(`should issue an adult licence if ${description}`, async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-04-01'))
        const endDate = moment(oldEndDate)
        const junior = { name: 'Junior', id: '3230c68f-ef65-e611-80dc-c4346bad4004', proof: { type: 'No Proof' } }
        const nowAdultPermission = existingPermission({
          endDate,
          licensee: {
            ...existingPermission().licensee,
            birthDate
          },
          concessions: [junior]
        })

        const ppd = await preparePermissionDataForRenewal(nowAdultPermission)
        expect(ppd.concessions).toEqual([])
        jest.useRealTimers()
      })

      it(`should issue an adult disabled licence if ${description} and the user has an existing disability concession`, async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-04-01'))
        const endDate = moment(oldEndDate)
        const junior = { name: 'Junior', id: '3230c68f-ef65-e611-80dc-c4346bad4004', proof: { type: 'No Proof' } }
        const disabled = {
          name: 'Disabled',
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          proof: { type: 'Blue Badge', referenceNumber: '123' }
        }
        const nowAdultPermission = existingPermission({
          endDate,
          licensee: {
            ...existingPermission().licensee,
            birthDate
          },
          concessions: [junior, disabled]
        })

        const ppd = await preparePermissionDataForRenewal(nowAdultPermission)
        expect(ppd.concessions).toEqual([disabled])
        jest.useRealTimers()
      })
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
