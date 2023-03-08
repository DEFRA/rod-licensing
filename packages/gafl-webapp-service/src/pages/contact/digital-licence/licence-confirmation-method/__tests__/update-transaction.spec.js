import updateTransaction from '../update-transaction'
import { CONTACT } from '../../../../../uri.js'

describe('licence-confirmation-method > update-transaction', () => {
  const mockTransactionCacheSet = jest.fn()
  const mockStatusCacheSet = jest.fn()

  const getPagePermission = (contactMethod, email, text) => ({
    payload: { 'licence-confirmation-method': contactMethod, email, text }
  })

  const getTransactionPermission = (licenceLength, licensee = {}) => ({
    licenceLength,
    licensee
  })

  const getMockRequest = (pagePermission = {}, transactionPermission = {}) => ({
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: () => pagePermission
        },
        transaction: {
          getCurrentPermission: () => transactionPermission,
          setCurrentPermission: mockTransactionCacheSet
        },
        status: {
          setCurrentPermission: mockStatusCacheSet
        }
      }
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('12 month licences', () => {
    const licenceLength = '12M'

    it('should set email in cache, when licence confirmation method is email', async () => {
      const pagePermission = getPagePermission('email', 'example@example.com')
      const transactionPermission = getTransactionPermission(licenceLength)
      const request = getMockRequest(pagePermission, transactionPermission)
      await updateTransaction(request)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: licenceLength,
          licensee: {
            email: 'example@example.com',
            preferredMethodOfConfirmation: 'Email',
            shortTermPreferredMethodOfConfirmation: 'Email'
          }
        })
      )
    })

    it('should set mobilePhone in cache, when licence confirmation method is text', async () => {
      const pagePermission = getPagePermission('text', null, '07700900088')
      const transactionPermission = getTransactionPermission(licenceLength)
      const request = getMockRequest(pagePermission, transactionPermission)
      await updateTransaction(request)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: licenceLength,
          licensee: { mobilePhone: '07700900088', preferredMethodOfConfirmation: 'Text', shortTermPreferredMethodOfConfirmation: 'Text' }
        })
      )
    })

    it('should set none in cache, when licence confirmation method is none', async () => {
      const pagePermission = getPagePermission('none')
      const transactionPermission = getTransactionPermission(licenceLength)
      const request = getMockRequest(pagePermission, transactionPermission)
      await updateTransaction(request)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: licenceLength,
          licensee: {
            preferredMethodOfConfirmation: 'Prefer not to be contacted',
            shortTermPreferredMethodOfConfirmation: 'Prefer not to be contacted'
          }
        })
      )
    })
  })

  describe('short licences', () => {
    const licenceLength = '1D'

    it('should set email in cache, when licence confirmation method is email', async () => {
      const pagePermission = getPagePermission('email', 'example@example.com')
      const transactionPermission = getTransactionPermission(licenceLength)
      const request = getMockRequest(pagePermission, transactionPermission)
      await updateTransaction(request)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: licenceLength,
          licensee: { email: 'example@example.com', shortTermPreferredMethodOfConfirmation: 'Email' }
        })
      )
    })

    it('should set mobilePhone in cache, when licence confirmation method is text', async () => {
      const pagePermission = getPagePermission('text', null, '07700900088')
      const transactionPermission = getTransactionPermission(licenceLength)
      const request = getMockRequest(pagePermission, transactionPermission)
      await updateTransaction(request)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: licenceLength,
          licensee: { mobilePhone: '07700900088', shortTermPreferredMethodOfConfirmation: 'Text' }
        })
      )
    })

    it('should set none in cache, when licence confirmation method is none', async () => {
      const pagePermission = getPagePermission('none')
      const transactionPermission = getTransactionPermission(licenceLength)
      const request = getMockRequest(pagePermission, transactionPermission)
      await updateTransaction(request)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: licenceLength,
          licensee: { shortTermPreferredMethodOfConfirmation: 'Prefer not to be contacted' }
        })
      )
    })
  })

  it('should set the contact page to false on the status cache', async () => {
    const request = getMockRequest(getPagePermission('none'), getTransactionPermission('12M'))
    await updateTransaction(request)

    expect(mockStatusCacheSet).toHaveBeenCalledWith({ [CONTACT.page]: false })
  })
})
