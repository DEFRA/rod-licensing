import updateTransaction from '../update-transaction'

describe('contact > update-transaction', () => {
  const mockPageCacheGet = jest.fn()
  const mockTransactionPageGet = jest.fn()
  const mockTransactionCacheSet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: mockPageCacheGet
        },
        transaction: {
          getCurrentPermission: mockTransactionPageGet,
          setCurrentPermission: mockTransactionCacheSet
        }
      }
    })
  }

  describe('for a 12 month licence (physical)', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {}
      }))
    })

    it('should set email and preferredMethodOfReminder in cache, when how-contacted is email', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'email',
          email: 'example@example.com'
        }
      }))

      await updateTransaction(mockRequest)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '12M',
          licensee: {
            email: 'example@example.com',
            preferredMethodOfReminder: 'Email'
          }
        })
      )
    })

    it('should set mobilePhone and preferredMethodOfReminder in cache, when how-contacted is test', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'text',
          text: '07700900088'
        }
      }))

      await updateTransaction(mockRequest)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '12M',
          licensee: {
            mobilePhone: '07700900088',
            preferredMethodOfReminder: 'Text'
          }
        })
      )
    })

    it('should set preferredMethodOfReminder in cache, when how-contacted is none', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'none'
        }
      }))

      await updateTransaction(mockRequest)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '12M',
          licensee: {
            preferredMethodOfReminder: 'Letter'
          }
        })
      )
    })
  })

  describe('for a 1 day licence (non-physical)', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '1D',
        licensee: {}
      }))
    })

    it('should set email, preferredMethodOfReminder and preferredMethodOfConfirmation in cache, when how-contacted is email', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'email',
          email: 'example@example.com'
        }
      }))

      await updateTransaction(mockRequest)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '1D',
          licensee: {
            email: 'example@example.com',
            preferredMethodOfReminder: 'Email',
            preferredMethodOfConfirmation: 'Email'
          }
        })
      )
    })

    it('should set text, preferredMethodOfReminder and preferredMethodOfConfirmation in cache, when how-contacted is email', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'text',
          text: '07700900088'
        }
      }))

      await updateTransaction(mockRequest)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '1D',
          licensee: {
            mobilePhone: '07700900088',
            preferredMethodOfReminder: 'Text',
            preferredMethodOfConfirmation: 'Text'
          }
        })
      )
    })

    it('should set preferredMethodOfReminder and preferredMethodOfConfirmation in cache, when how-contacted is none', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'none'
        }
      }))

      await updateTransaction(mockRequest)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '1D',
          licensee: {
            preferredMethodOfReminder: 'Prefer not to be contacted',
            preferredMethodOfConfirmation: 'Prefer not to be contacted'
          }
        })
      )
    })
  })
})
