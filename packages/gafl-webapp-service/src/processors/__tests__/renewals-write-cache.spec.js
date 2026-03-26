import { salesApi } from '@defra-fish/connectors-lib'
import moment from 'moment'
import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../renewals-write-cache'
import { ADDRESS_LOOKUP, CONTACT, LICENCE_TYPE, NAME, LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD } from '../../uri'

jest.mock('@defra-fish/connectors-lib')

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
        ...overrides
      }
    })

    const getPreparedPermissionData = (overrides = {}) => ({
      isRenewal: true,
      licenceLength: '12M',
      licenceType: 'Salmon and sea trout',
      numberOfRods: '1',
      isLicenceForYou: true,
      licenceToStart: 'another-date',
      licenceStartDate: moment().add(5, 'days').format('YYYY-MM-DD'),
      licenceStartTime: moment().add(5, 'days').hours(),
      renewedEndDate: moment().add(5, 'days').toISOString(),
      renewedHasExpired: false,
      licensee: {
        birthDate: '2000-10-03',
        country: 'England',
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
      concessions: [],
      permitId: '123456',
      ...overrides
    })

    beforeEach(jest.clearAllMocks)

    it('should store licenceLength from preparedData in the cache', async () => {
      const setTransactionCache = jest.fn()
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(getPreparedPermissionData())
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '12M'
        })
      )
    })

    it('should store isRenewal as true', async () => {
      const setTransactionCache = jest.fn()
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(getPreparedPermissionData())
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          isRenewal: true
        })
      )
    })

    it('should store licence type and number of rods from preparedData in the cache', async () => {
      const setTransactionCache = jest.fn()
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(getPreparedPermissionData())
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceType: 'Salmon and sea trout',
          numberOfRods: '1'
        })
      )
    })

    it('should store date fields from preparedData in the cache', async () => {
      const setTransactionCache = jest.fn()
      const preparedData = getPreparedPermissionData({
        licenceToStart: 'after-payment',
        licenceStartDate: '2026-03-26',
        licenceStartTime: 0,
        renewedEndDate: '2026-03-20T00:00:00.000Z',
        renewedHasExpired: true
      })
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(preparedData)
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceToStart: 'after-payment',
          licenceStartDate: '2026-03-26',
          licenceStartTime: 0,
          renewedEndDate: '2026-03-20T00:00:00.000Z',
          renewedHasExpired: true
        })
      )
    })

    it('should map the licensee object correctly', async () => {
      const setTransactionCache = jest.fn()
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(getPreparedPermissionData())
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licensee: expect.objectContaining({
            birthDate: '2000-10-03',
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
      const setupAndGetTransactionCacheSetter = async licenseeOverrides => {
        const setTransactionCache = jest.fn()
        const preparedData = getPreparedPermissionData({
          licensee: {
            ...getPreparedPermissionData().licensee,
            ...licenseeOverrides
          }
        })
        salesApi.preparePermissionDataForRenewal.mockResolvedValue(preparedData)
        await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
        return setTransactionCache
      }

      it('removes null mobilePhone value', async () => {
        const setTransactionCache = await setupAndGetTransactionCacheSetter({ mobilePhone: null })
        expect(setTransactionCache).toHaveBeenCalledWith(
          expect.objectContaining({
            licensee: expect.not.objectContaining({
              mobilePhone: null
            })
          })
        )
      })

      it('keeps false postalFulfilment value', async () => {
        const setTransactionCache = await setupAndGetTransactionCacheSetter({ postalFulfilment: false })
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
      const setTransactionCache = jest.fn()
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(getPreparedPermissionData())
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

    it('should store countryCode within the licensee object', async () => {
      const setTransactionCache = jest.fn()
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(getPreparedPermissionData())
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      const [[{ licensee }]] = setTransactionCache.mock.calls
      expect(licensee).toEqual(expect.objectContaining({ countryCode: 'GB-ENG' }))
    })

    it('should have an empty array if no concessions are present', async () => {
      const setTransactionCache = jest.fn()
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(getPreparedPermissionData({ concessions: [] }))
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          concessions: []
        })
      )
    })

    it('should have an array of concessions if they are present', async () => {
      const setTransactionCache = jest.fn()
      const preparedData = getPreparedPermissionData({
        concessions: [
          {
            name: 'Disabled',
            id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
            proof: {
              type: 'Blue Badge',
              referenceNumber: '1233'
            }
          }
        ]
      })
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(preparedData)
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          concessions: [{ type: 'Disabled', proof: { type: 'Blue Badge', referenceNumber: '1233' } }]
        })
      )
    })

    it('should omit referenceNumber from concession proof when it is not present', async () => {
      const setTransactionCache = jest.fn()
      const preparedData = getPreparedPermissionData({
        concessions: [
          {
            name: 'Senior',
            id: 'senior-concession-id',
            proof: {
              type: 'No Proof'
            }
          }
        ]
      })
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(preparedData)
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          concessions: [{ type: 'Senior', proof: { type: 'No Proof' } }]
        })
      )
    })

    it('should set showDigitalLicencePages to true on the status cache if postalFulfilment is true', async () => {
      const setStatusCache = jest.fn()
      const preparedData = getPreparedPermissionData({
        licensee: {
          ...getPreparedPermissionData().licensee,
          postalFulfilment: true
        }
      })
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(preparedData)
      await setUpCacheFromAuthenticationResult(getMockRequest({ setStatusCache }), getAuthenticationResult())
      expect(setStatusCache).toHaveBeenCalledWith(
        expect.objectContaining({
          showDigitalLicencePages: true
        })
      )
    })

    it('should set showDigitalLicencePages to true on the status cache if postalFulfilment is undefined', async () => {
      const setStatusCache = jest.fn()
      const preparedData = getPreparedPermissionData({
        licensee: {
          ...getPreparedPermissionData().licensee,
          postalFulfilment: undefined
        }
      })
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(preparedData)
      await setUpCacheFromAuthenticationResult(getMockRequest({ setStatusCache }), getAuthenticationResult())
      expect(setStatusCache).toHaveBeenCalledWith(
        expect.objectContaining({
          showDigitalLicencePages: true
        })
      )
    })

    it('should set showDigitalLicencePages to false on the status cache if postalFulfilment is false', async () => {
      const setStatusCache = jest.fn()
      const preparedData = getPreparedPermissionData({
        licensee: {
          ...getPreparedPermissionData().licensee,
          postalFulfilment: false
        }
      })
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(preparedData)
      await setUpCacheFromAuthenticationResult(getMockRequest({ setStatusCache }), getAuthenticationResult())
      expect(setStatusCache).toHaveBeenCalledWith(
        expect.objectContaining({
          showDigitalLicencePages: false
        })
      )
    })

    it('should store isLicenceForYou from preparedData in the cache', async () => {
      const setTransactionCache = jest.fn()
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(getPreparedPermissionData({ isLicenceForYou: true }))
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          isLicenceForYou: true
        })
      )
    })

    it.each`
      licenceStartDate | licenceStartTime | timeDesc
      ${'2024-03-05'}  | ${0}             | ${'midnight'}
      ${'2024-03-05'}  | ${14}            | ${'14:00'}
      ${'2024-03-04'}  | ${0}             | ${'after payment'}
    `('starts from $timeDesc on $licenceStartDate', async ({ licenceStartDate, licenceStartTime }) => {
      const setTransactionCache = jest.fn()
      const preparedData = getPreparedPermissionData({
        licenceStartDate,
        licenceStartTime
      })
      salesApi.preparePermissionDataForRenewal.mockResolvedValue(preparedData)
      await setUpCacheFromAuthenticationResult(getMockRequest({ setTransactionCache }), getAuthenticationResult())
      expect(setTransactionCache).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceStartDate,
          licenceStartTime
        })
      )
    })
  })

  describe('setupPayloads', () => {
    const getSamplePermission = () => ({
      licenceType: 'salmon-and-sea-trout',
      licensee: {
        birthDate: '2000-10-03',
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
