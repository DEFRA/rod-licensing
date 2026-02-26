import { salesApi } from '@defra-fish/connectors-lib'
import moment from 'moment'
import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../renewals-write-cache'
import { ADDRESS_LOOKUP, CONTACT, LICENCE_TYPE, NAME, LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD } from '../../uri'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    preparePermissionDataForRenewal: jest.fn()
  }
}))

const buildPreparedPermission = (overrides = {}) => {
  const base = {
    isRenewal: true,
    licenceLength: '12M',
    licenceType: 'Salmon and sea trout',
    numberOfRods: '1',
    isLicenceForYou: true,
    licensee: {
      postalFulfilment: true,
      birthDate: '2004-01-13',
      countryCode: 'GB-ENG',
      email: 'email@gmail.com',
      firstName: 'Negativetwelve',
      lastName: 'Test',
      postcode: 'SN15 3PG',
      street: 'Blackthorn Mews',
      town: 'Chippenham',
      preferredMethodOfNewsletter: 'Email',
      preferredMethodOfConfirmation: 'Text',
      preferredMethodOfReminder: 'Text'
    },
    concessions: []
  }

  return {
    ...base,
    ...overrides,
    licensee: { ...base.licensee, ...(overrides.licensee || {}) }
  }
}

const mockPreparedPermissionOnce = (overrides = {}) =>
  salesApi.preparePermissionDataForRenewal.mockResolvedValueOnce({
    permission: buildPreparedPermission(overrides)
  })

beforeEach(() => {
  jest.clearAllMocks()
})

describe('renewals-write-cache', () => {
  const getMockRequest = ({
    setPageCache = () => {},
    setStatusCache = () => {},
    getTransactionCache = () => ({}),
    setTransactionCache = () => {}
  } = {}) => ({
    cache: () => ({
      helpers: {
        page: {
          setCurrentPermission: setPageCache
        },
        status: {
          setCurrentPermission: setStatusCache
        },
        transaction: {
          getCurrentPermission: getTransactionCache,
          setCurrentPermission: setTransactionCache
        }
      }
    })
  })

  describe('setUpCacheFromAuthenticationResult', () => {
    const getAuthenticationResult = (overrides = {}) => ({
      permission: {
        referenceNumber: 'abc',
        licensee: {
          birthDate: '2004-01-13',
          country: {
            id: '910400000',
            label: 'England',
            description: 'GB-ENG'
          },
          email: 'email@gmail.com',
          firstName: 'Negativetwelve',
          lastName: 'Test',
          postcode: 'SN15 3PG',
          preferredMethodOfConfirmation: {
            id: 910400002,
            label: 'Text',
            description: 'Text'
          },
          preferredMethodOfNewsletter: {
            id: 910400000,
            label: 'Email',
            description: 'Email'
          },
          preferredMethodOfReminder: {
            id: 910400002,
            label: 'Text',
            description: 'Text'
          },
          shortTermPreferredMethodOfConfirmation: {
            id: 910400002,
            label: 'Text',
            description: 'Text'
          },
          street: 'Blackthorn Mews',
          town: 'Chippenham'
        },
        concessions: [],
        permit: {
          permitSubtype: {
            label: 'Salmon and sea trout'
          },
          numberOfRods: 1
        },
        isLicenceForYou: true,
        ...overrides
      }
    })

    it('should set licence length to 12M, as only 12 month licences can be renewed', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '12M'
        })
      )
    })

    it('should set isRenewal to true', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          isRenewal: true
        })
      )
    })

    it('should set licence type and number of rods from prepared renewal data', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceType: 'Salmon and sea trout',
          numberOfRods: '1'
        })
      )
    })

    it('should set start and end dates, if renewal has not expired', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      const endDate = moment().add(5, 'days')
      const mockDateAuthResult = getAuthenticationResult({ endDate })
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), mockDateAuthResult)
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceToStart: 'another-date',
          licenceStartDate: endDate.format('YYYY-MM-DD'),
          licenceStartTime: endDate.hours(),
          renewedEndDate: endDate.toISOString(),
          renewedHasExpired: false
        })
      )
    })

    it('should set start and end dates, if renewal has expired', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      const endDate = moment().subtract(5, 'days')
      const mockDateAuthResult = getAuthenticationResult({ endDate })
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), mockDateAuthResult)
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceToStart: 'after-payment',
          licenceStartDate: moment().format('YYYY-MM-DD'),
          licenceStartTime: 0,
          renewedEndDate: endDate.toISOString(),
          renewedHasExpired: true
        })
      )
    })

    it('should map the licensee object correctly', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licensee: expect.objectContaining({
            birthDate: '2004-01-13',
            countryCode: 'GB-ENG',
            email: 'email@gmail.com',
            firstName: 'Negativetwelve',
            lastName: 'Test',
            postcode: 'SN15 3PG',
            street: 'Blackthorn Mews',
            town: 'Chippenham'
          })
        })
      )
    })

    describe('should remove null values and keep false values from the licensee object', () => {
      const setupAndGetTransactionCacheSetter = async () => {
        mockPreparedPermissionOnce({
          licensee: {
            postalFulfilment: false
          }
        })
        const setTransactionCache = jest.fn()

        await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
        return setTransactionCache
      }

      it('removes null mobilePhone value', async () => {
        const setTransactionCache = await setupAndGetTransactionCacheSetter()
        expect(setTransactionCache).toHaveBeenCalledWith(
          expect.objectContaining({
            licensee: expect.not.objectContaining({
              mobilePhone: null
            })
          })
        )
      })

      it('keeps false postalFulfilment value', async () => {
        const setTransactionCache = await setupAndGetTransactionCacheSetter()
        expect(setTransactionCache).toHaveBeenCalledWith(
          expect.objectContaining({
            licensee: expect.objectContaining({
              postalFulfilment: false
            })
          })
        )
      })
    })

    it('should map the contact preferences correctly', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licensee: expect.objectContaining({
            preferredMethodOfNewsletter: 'Email',
            preferredMethodOfConfirmation: 'Text',
            preferredMethodOfReminder: 'Text'
          })
        })
      )
    })

    it.each(['country', 'shortTermPreferredMethodOfConfirmation'])('should not assign %s to the licensee', async prop => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      const [[{ licensee }]] = setTransactionCache.mock.calls
      expect(licensee[prop]).toBeUndefined()
    })

    it('should have an empty array if there no match for the provided concession', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      const mockConcessionAuthResult = getAuthenticationResult({
        concessions: [{ id: 'non-existent-concession' }]
      })
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), mockConcessionAuthResult)
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          concessions: []
        })
      )
    })

    it('should have an empty array if no concessions are present', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          concessions: []
        })
      )
    })

    it('should have an array of concessions if they are present', async () => {
      mockPreparedPermissionOnce({
        concessions: [{ proof: { referenceNumber: '1233', type: 'Blue Badge' }, type: 'Disabled' }]
      })
      const setTransactionCache = jest.fn()

      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          concessions: [{ proof: { referenceNumber: '1233', type: 'Blue Badge' }, type: 'Disabled' }]
        })
      )
    })

    it('should set renewal on the transaction cache', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          isRenewal: true
        })
      )
    })

    it('should set showDigitalLicencePages to true on the status cache if postalFulfilment is true', async () => {
      mockPreparedPermissionOnce()
      const setStatusCache = jest.fn()
      await setUpCacheFromAuthenticationResult(getMockRequest({ setStatusCache }), getAuthenticationResult())
      expect(setStatusCache).toHaveBeenCalledWith(expect.objectContaining({ showDigitalLicencePages: true }))
    })

    it('should set showDigitalLicencePages to true on the status cache if postalFulfilment is undefined', async () => {
      mockPreparedPermissionOnce({
        licensee: { postalFulfilment: undefined }
      })
      const setStatusCache = jest.fn()

      await setUpCacheFromAuthenticationResult(getMockRequest({ setStatusCache }), getAuthenticationResult())
      expect(setStatusCache).toHaveBeenCalledWith(expect.objectContaining({ showDigitalLicencePages: true }))
    })

    it('should set showDigitalLicencePages to false on the status cache if postalFulfilment is false', async () => {
      mockPreparedPermissionOnce({
        licensee: { postalFulfilment: false }
      })
      const setStatusCache = jest.fn()

      await setUpCacheFromAuthenticationResult(getMockRequest({ setStatusCache }), getAuthenticationResult())
      expect(setStatusCache).toHaveBeenCalledWith(expect.objectContaining({ showDigitalLicencePages: false }))
    })

    it('should have isLicenceForYou set to true', async () => {
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      const isLicenceForYou = true
      const mockPermissionAuthResult = getAuthenticationResult({ isLicenceForYou })
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), mockPermissionAuthResult)
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          isLicenceForYou: true
        })
      )
    })

    it.each`
      endDate                       | licenceStartDate | licenceStartTime | timeDesc
      ${'2024-03-04T23:59:59.000Z'} | ${'2024-03-05'}  | ${0}             | ${'midnight'}
      ${'2024-03-05T14:56:27.109Z'} | ${'2024-03-05'}  | ${14}            | ${'14:00'}
      ${'2024-03-02T13:28:47.102Z'} | ${'2024-03-04'}  | ${0}             | ${'after payment'}
    `('starts from $timeDesc on $licenceStartDate, if expiry is at $endDate', async ({ endDate, licenceStartDate, licenceStartTime }) => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-03-04T14:37:28.743Z'))
      mockPreparedPermissionOnce()
      const setTransactionCache = jest.fn()
      const permission = getAuthenticationResult({ endDate })
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), permission)
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceStartDate,
          licenceStartTime
        })
      )
    })
  })

  describe('setUpPayloads', () => {
    const getSamplePermission = () => ({
      licenceType: 'salmon-and-sea-trout',
      licensee: {
        birthDate: '2004-01-13',
        email: 'email@gmail.com',
        firstName: 'First',
        lastName: 'Last',
        postcode: 'SN15 3PG',
        premises: '1',
        preferredMethodOfConfirmation: 'Email'
      }
    })

    beforeEach(jest.clearAllMocks)

    it('should set the licence-type on the licence-type page to salmon-and-sea-trout in the cache, if licenceType is Salmon and sea trout', async () => {
      const getTransactionCache = () => getSamplePermission()
      const setPageCache = jest.fn()
      await setUpPayloads(getMockRequest({ setPageCache, getTransactionCache }))
      expect(setPageCache).toBeCalledWith(LICENCE_TYPE.page, {
        payload: {
          'licence-type': 'salmon-and-sea-trout'
        }
      })
    })

    it('should set the licence-type on the licence-type page to trout-and-coarse-2-rod in the cache, if licenceType is Trout and coarse and numberOfRods is 2', async () => {
      const getTransactionCache = () => ({
        ...getSamplePermission(),
        licenceType: 'Trout and coarse',
        numberOfRods: '2'
      })
      const setPageCache = jest.fn()
      await setUpPayloads(getMockRequest({ setPageCache, getTransactionCache }))
      expect(setPageCache).toBeCalledWith(LICENCE_TYPE.page, {
        payload: {
          'licence-type': 'trout-and-coarse-2-rod'
        }
      })
    })

    it('should set the licence-type on the licence-type page to trout-and-coarse-3-rod in the cache, if licenceType is Trout and coarse and numberOfRods is 3', async () => {
      const setPageCache = jest.fn()
      const getTransactionCache = () => ({
        ...getSamplePermission(),
        licenceType: 'Trout and coarse',
        numberOfRods: '3'
      })
      await setUpPayloads(getMockRequest({ setPageCache, getTransactionCache }))
      expect(setPageCache).toBeCalledWith(LICENCE_TYPE.page, {
        payload: {
          'licence-type': 'trout-and-coarse-3-rod'
        }
      })
    })

    it('should set the first-name and last-name on the name page in the cache', async () => {
      const setPageCache = jest.fn()
      const getTransactionCache = () => getSamplePermission()
      await setUpPayloads(getMockRequest({ setPageCache, getTransactionCache }))
      expect(setPageCache).toBeCalledWith(NAME.page, {
        payload: {
          'first-name': 'First',
          'last-name': 'Last'
        }
      })
    })

    it('should set the premises and postcode on the address-lookup page in the cache', async () => {
      const setPageCache = jest.fn()
      const getTransactionCache = () => getSamplePermission()
      await setUpPayloads(getMockRequest({ setPageCache, getTransactionCache }))
      expect(setPageCache).toBeCalledWith(ADDRESS_LOOKUP.page, {
        payload: {
          premises: '1',
          postcode: 'SN15 3PG'
        }
      })
    })

    it('should set the how-contacted to email with an email on the contact page in the cache, if preferredMethodOfConfirmation is Email', async () => {
      const setPageCache = jest.fn()
      const getTransactionCache = () => getSamplePermission()
      await setUpPayloads(getMockRequest({ setPageCache, getTransactionCache }))
      expect(setPageCache).toBeCalledWith(CONTACT.page, {
        payload: {
          'how-contacted': 'email',
          email: 'email@gmail.com'
        }
      })
    })

    it('should set the how-contacted to text with a phone number on the contact page in the cache, if preferredMethodOfConfirmation is Text', async () => {
      const setPageCache = jest.fn()
      const getTransactionCache = () => ({
        ...getSamplePermission(),
        licensee: {
          preferredMethodOfConfirmation: 'Text',
          mobilePhone: '07700900900'
        }
      })
      await setUpPayloads(getMockRequest({ setPageCache, getTransactionCache }))
      expect(setPageCache).toBeCalledWith(CONTACT.page, {
        payload: {
          'how-contacted': 'text',
          text: '07700900900'
        }
      })
    })

    it('should set the how-contacted to none on the contact page in the cache, if preferredMethodOfConfirmation is Letter', async () => {
      const setPageCache = jest.fn()
      const getTransactionCache = () => ({
        ...getSamplePermission(),
        licensee: {
          preferredMethodOfConfirmation: 'Letter'
        }
      })
      await setUpPayloads(getMockRequest({ setPageCache, getTransactionCache }))
      expect(setPageCache).toBeCalledWith(CONTACT.page, {
        payload: {
          'how-contacted': 'none'
        }
      })
    })

    it('should set the licence-fulfilment to true on the status cache', async () => {
      const setStatusCache = jest.fn()
      const getTransactionCache = () => getSamplePermission()
      await setUpPayloads(getMockRequest({ setStatusCache, getTransactionCache }))
      expect(setStatusCache).toBeCalledWith({ [LICENCE_FULFILMENT.page]: true })
    })

    it('should set the licence-confirmation-method to true on the status cache', async () => {
      const setStatusCache = jest.fn()
      const getTransactionCache = () => getSamplePermission()
      await setUpPayloads(getMockRequest({ setStatusCache, getTransactionCache }))
      expect(setStatusCache).toBeCalledWith({ [LICENCE_CONFIRMATION_METHOD.page]: true })
    })
  })
})
