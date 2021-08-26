import { salesApi } from '@defra-fish/connectors-lib'
import moment from 'moment'

import { setUpCacheFromAuthenticationResult } from '../renewals-write-cache'
import mockConcessions from '../../__mocks__/data/concessions'

jest.mock('@defra-fish/connectors-lib')
salesApi.concessions.getAll.mockResolvedValue(mockConcessions)

describe('renewals-write-cache', () => {
  beforeEach(jest.clearAllMocks)

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
          street: 'Blackthorn Mews',
          town: 'Chippenham'
        },
        concessions: [],
        permit: {
          permitSubtype: {
            label: 'Salmon and sea trout'
          },
          numberOfRods: 1
        }
      }
    }

    beforeEach(() => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))
    })

    it('should set licence length to 12M, as only 12 month licences can be renewed', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '12M'
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

    it('should set renewal and fromSummary on the status cache', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockStatusCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          renewal: true,
          fromSummary: 'contact-summary'
        })
      )
    })
  })
})
