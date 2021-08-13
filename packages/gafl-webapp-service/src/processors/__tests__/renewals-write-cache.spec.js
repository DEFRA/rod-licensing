import { salesApi } from '@defra-fish/connectors-lib'
import { setUpCacheFromAuthenticationResult } from '../renewals-write-cache'
import mockConcessions from '../../__mocks__/data/concessions'
import mockTransaction from '../../services/payment/__test__/data/mock-transaction'

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
          birthDate: "2004-01-13",
          country: {
            id: "910400000",
            label: "England",
            description: "GB-ENG"
          },
          email: "email@gmail.com",
          firstName: "Negativetwelve",
          lastName: "Test",
          postcode: "SN15 3PG",
          preferredMethodOfConfirmation: "Email",
          preferredMethodOfNewsletter: "Prefer not to be contacted",
          preferredMethodOfReminder: "Email",
          street: "Blackthorn Mews",
          town: "Chippenham"
        },
        concessions: [],
        permit: {
          permitSubtype: {
            label: "Salmon and sea trout"
          },
          numberOfRods: 1
        }
      }
    }

    beforeEach(() => {
      jest.clearAllMocks()
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))
    })

    it('should set licence length to 12M, as only 12 month licences can be renewed', async () => {
      await setUpCacheFromAuthenticationResult(mockRequest, authenticationResult)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '12M',
        })
      )
    })
  })
})