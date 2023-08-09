import { salesApi } from '@defra-fish/connectors-lib'
import moment from 'moment'

import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../renewals-write-cache'
import mockConcessions from '../../__mocks__/data/concessions'
import { ADDRESS_LOOKUP, CONTACT, LICENCE_TYPE, NAME, LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD } from '../../uri'

jest.mock('@defra-fish/connectors-lib')
salesApi.concessions.getAll.mockResolvedValue(mockConcessions)

describe('renewals-write-cache', () => {
  describe('setUpCacheFromAuthenticationResult', () => {
    const mockStatusCacheSet = jest.fn()
    const mockTransactionCacheGet = jest.fn()
    const mockTransactionCacheSet = jest.fn()

    const mockRequest = {
      cache: () => ({
        helpers: {
          status: {
            setCurrentPermission: mockStatusCacheSet
          },
          transaction: {
            getCurrentPermission: mockTransactionCacheGet,
            setCurrentPermission: mockTransactionCacheSet
          }
        }
      })
    }

    const authenticationResult = {
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
        isLicenceForYou: true
      }
    }

    beforeEach(() => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))
      jest.clearAllMocks()
    })

    it('should set licence length to 12M, as only 12 month licences can be renewed', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '12M'
        })
      )
    })

    it('should set isRenewal to true', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          isRenewal: true
        })
      )
    })

    it('should set licence type and number of rods to the values in the permit', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceType: 'Salmon and sea trout',
          numberOfRods: '1'
        })
      )
    })

    it('should set start and end dates, if renewal has not expired', async () => {
      const endDate = moment().add(5, 'days')
      const mockDateAuthResult = {
        permission: {
          ...authenticationResult.permission,
          endDate
        }
      }
      await setUpCacheFromAuthenticationResult(mockRequest, mockDateAuthResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
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
      const endDate = moment().subtract(5, 'days')
      const mockDateAuthResult = {
        permission: {
          ...authenticationResult.permission,
          endDate
        }
      }
      await setUpCacheFromAuthenticationResult(mockRequest, mockDateAuthResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
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
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
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

    it('should remove null values and keep false values from the licensee object', async () => {
      const authResultNullFalse = {
        permission: {
          ...authenticationResult.permission,
          licensee: {
            ...authenticationResult.permission.licensee,
            mobilePhone: null,
            postalFulfilment: false
          }
        }
      }
      await setUpCacheFromAuthenticationResult(mockRequest, authResultNullFalse)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licensee: expect.not.objectContaining({
            mobilePhone: null
          })
        })
      )
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licensee: expect.objectContaining({
            postalFulfilment: false
          })
        })
      )
    })

    it('should map the contact preferences correctly', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
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
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      const [[{ licensee }]] = mockTransactionCacheSet.mock.calls
      expect(licensee[prop]).toBeUndefined()
    })

    it('should have an empty array if no concessions are present', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          concessions: []
        })
      )
    })

    it('should have an array of concessions if they are present', async () => {
      const mockConccessionAuthResult = {
        permission: {
          ...authenticationResult.permission,
          concessions: [
            {
              id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
              proof: {
                id: 'concession-proof-id',
                referenceNumber: '1233',
                type: {
                  id: 910400000,
                  label: 'Blue Badge',
                  description: 'Blue Badge'
                }
              }
            }
          ]
        }
      }
      await setUpCacheFromAuthenticationResult(mockRequest, mockConccessionAuthResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          concessions: [{ proof: { referenceNumber: '1233', type: 'Blue Badge' }, type: 'Disabled' }]
        })
      )
    })

    it('should set renewal on the transaction cache', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          isRenewal: true
        })
      )
    })

    it('should set showDigitalLicencePages to true on the status cache if postalFulfilment is true', async () => {
      const authPostalFulfilmentFalse = {
        permission: {
          ...authenticationResult.permission,
          licensee: {
            ...authenticationResult.permission.licensee,
            postalFulfilment: true
          }
        }
      }
      await setUpCacheFromAuthenticationResult(mockRequest, authPostalFulfilmentFalse)
      expect(mockStatusCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          showDigitalLicencePages: true
        })
      )
    })

    it('should set showDigitalLicencePages to true on the status cache if postalFulfilment is undefined', async () => {
      const authPostalFulfilmentFalse = {
        permission: {
          ...authenticationResult.permission,
          licensee: {
            ...authenticationResult.permission.licensee,
            postalFulfilment: undefined
          }
        }
      }
      await setUpCacheFromAuthenticationResult(mockRequest, authPostalFulfilmentFalse)
      expect(mockStatusCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          showDigitalLicencePages: true
        })
      )
    })

    it('should set showDigitalLicencePages to false on the status cache if postalFulfilment is false', async () => {
      const authPostalFulfilmentFalse = {
        permission: {
          ...authenticationResult.permission,
          licensee: {
            ...authenticationResult.permission.licensee,
            postalFulfilment: false
          }
        }
      }
      await setUpCacheFromAuthenticationResult(mockRequest, authPostalFulfilmentFalse)
      expect(mockStatusCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          showDigitalLicencePages: false
        })
      )
    })

    it('should have isLicenceForYou set to true', async () => {
      const isLicenceForYou = true
      const mockPermissionAuthResult = {
        permission: {
          ...authenticationResult.permission,
          isLicenceForYou
        }
      }
      await setUpCacheFromAuthenticationResult(mockRequest, mockPermissionAuthResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          isLicenceForYou: true
        })
      )
    })
  })

  describe('setupPayloads', () => {
    const mockTransactionCacheGet = jest.fn()
    const mockPageCacheSet = jest.fn()
    const mockStatusCacheSet = jest.fn()

    const mockRequest = {
      cache: () => ({
        helpers: {
          transaction: {
            getCurrentPermission: mockTransactionCacheGet
          },
          page: {
            setCurrentPermission: mockPageCacheSet
          },
          status: {
            setCurrentPermission: mockStatusCacheSet
          }
        }
      })
    }

    const permission = {
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
    }

    beforeEach(jest.clearAllMocks)

    it('should set the licence-type on the licence-type page to salmon-and-sea-trout in the cache, if licenceType is Salmon and sea trout', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => permission)
      await setUpPayloads(mockRequest)
      expect(mockPageCacheSet).toBeCalledWith(LICENCE_TYPE.page, {
        payload: {
          'licence-type': 'salmon-and-sea-trout'
        }
      })
    })

    it('should set the licence-type on the licence-type page to trout-and-coarse-2-rod in the cache, if licenceType is Trout and coarse and numberOfRods is 2', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        ...permission,
        licenceType: 'Trout and coarse',
        numberOfRods: '2'
      }))
      await setUpPayloads(mockRequest)
      expect(mockPageCacheSet).toBeCalledWith(LICENCE_TYPE.page, {
        payload: {
          'licence-type': 'trout-and-coarse-2-rod'
        }
      })
    })

    it('should set the licence-type on the licence-type page to trout-and-coarse-3-rod in the cache, if licenceType is Trout and coarse and numberOfRods is 3', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        ...permission,
        licenceType: 'Trout and coarse',
        numberOfRods: '3'
      }))
      await setUpPayloads(mockRequest)
      expect(mockPageCacheSet).toBeCalledWith(LICENCE_TYPE.page, {
        payload: {
          'licence-type': 'trout-and-coarse-3-rod'
        }
      })
    })

    it('should set the first-name and last-name on the name page in the cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => permission)
      await setUpPayloads(mockRequest)
      expect(mockPageCacheSet).toBeCalledWith(NAME.page, {
        payload: {
          'first-name': 'First',
          'last-name': 'Last'
        }
      })
    })

    it('should set the premises and postcode on the address-lookup page in the cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => permission)
      await setUpPayloads(mockRequest)
      expect(mockPageCacheSet).toBeCalledWith(ADDRESS_LOOKUP.page, {
        payload: {
          premises: '1',
          postcode: 'SN15 3PG'
        }
      })
    })

    it('should set the how-contacted to email with an email on the contact page in the cache, if preferredMethodOfConfirmation is Email', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => permission)
      await setUpPayloads(mockRequest)
      expect(mockPageCacheSet).toBeCalledWith(CONTACT.page, {
        payload: {
          'how-contacted': 'email',
          email: 'email@gmail.com'
        }
      })
    })

    it('should set the how-contacted to text with a phone number on the contact page in the cache, if preferredMethodOfConfirmation is Text', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        ...permission,
        licensee: {
          preferredMethodOfConfirmation: 'Text',
          mobilePhone: '07700900900'
        }
      }))
      await setUpPayloads(mockRequest)
      expect(mockPageCacheSet).toBeCalledWith(CONTACT.page, {
        payload: {
          'how-contacted': 'text',
          text: '07700900900'
        }
      })
    })

    it('should set the how-contacted to none on the contact page in the cache, if preferredMethodOfConfirmation is Letter', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        ...permission,
        licensee: {
          preferredMethodOfConfirmation: 'Letter'
        }
      }))
      await setUpPayloads(mockRequest)
      expect(mockPageCacheSet).toBeCalledWith(CONTACT.page, {
        payload: {
          'how-contacted': 'none'
        }
      })
    })

    it('should set the licence-fulfilment to true on the status cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => permission)
      await setUpPayloads(mockRequest)
      expect(mockStatusCacheSet).toBeCalledWith({ [LICENCE_FULFILMENT.page]: true })
    })

    it('should set the licence-confirmation-method to true on the status cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => permission)
      await setUpPayloads(mockRequest)
      expect(mockStatusCacheSet).toBeCalledWith({ [LICENCE_CONFIRMATION_METHOD.page]: true })
    })
  })
})
