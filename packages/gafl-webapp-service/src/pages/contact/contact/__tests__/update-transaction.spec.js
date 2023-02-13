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
    })

    it('should set email and preferredMethodOfReminder in cache, when how-contacted is email', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {}
      }))

      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'email',
          email: 'example@example.com'
        }
      }))

      await updateTransaction(mockRequest)

      const method = mockTransactionCacheSet.mock.calls[0]
      expect(method[0]).toMatchObject({
        licenceLength: '12M',
        licensee: expect.objectContaining({
          email: 'example@example.com',
          preferredMethodOfReminder: 'Email'
        })
      })
      expect(method[0]).not.toHaveProperty('licensee.preferredMethodOfConfirmation')
    })

    it('should set mobilePhone and preferredMethodOfReminder in cache, when how-contacted is text', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {}
      }))

      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'text',
          text: '07700900088'
        }
      }))

      await updateTransaction(mockRequest)

      const method = mockTransactionCacheSet.mock.calls[0]
      expect(method[0]).toMatchObject({
        licenceLength: '12M',
        licensee: expect.objectContaining({
          mobilePhone: '07700900088',
          preferredMethodOfReminder: 'Text'
        })
      })
      expect(method[0]).not.toHaveProperty('licensee.preferredMethodOfConfirmation')
    })

    it('should set preferredMethodOfReminder in cache, when how-contacted is none', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {}
      }))

      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'none'
        }
      }))

      await updateTransaction(mockRequest)

      const method = mockTransactionCacheSet.mock.calls[0]
      expect(method[0]).toMatchObject({
        licenceLength: '12M',
        licensee: expect.objectContaining({
          preferredMethodOfReminder: 'Letter'
        })
      })
      expect(method[0]).not.toHaveProperty('licensee.preferredMethodOfConfirmation')
    })

    it('should preserve the email and set preferredMethodOfReminder to text, when how-contacted is text', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          email: 'example@example.com'
        }
      }))

      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'text',
          text: '07700900088'
        }
      }))

      await updateTransaction(mockRequest)

      const method = mockTransactionCacheSet.mock.calls[0]
      expect(method[0]).toMatchObject({
        licenceLength: '12M',
        licensee: expect.objectContaining({
          mobilePhone: '07700900088',
          preferredMethodOfReminder: 'Text',
          email: 'example@example.com'
        })
      })
    })

    it('should preserve mobilePhone and set preferredMethodOfReminder to email, when how-contacted is email', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          mobilePhone: '07700900088'
        }
      }))

      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'email',
          email: 'example@example.com'
        }
      }))

      await updateTransaction(mockRequest)

      const method = mockTransactionCacheSet.mock.calls[0]
      expect(method[0]).toMatchObject({
        licenceLength: '12M',
        licensee: expect.objectContaining({
          mobilePhone: '07700900088',
          preferredMethodOfReminder: 'Email',
          email: 'example@example.com'
        })
      })
    })

    it('should preserve the original email and set preferredMethodOfReminder to text, when how-contacted is text and when an email is passed in', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          email: 'example@example.com'
        }
      }))

      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'text',
          text: '07700900088',
          email: 'somone@example.com'
        }
      }))

      await updateTransaction(mockRequest)

      const method = mockTransactionCacheSet.mock.calls[0]
      expect(method[0]).toMatchObject({
        licenceLength: '12M',
        licensee: expect.objectContaining({
          mobilePhone: '07700900088',
          preferredMethodOfReminder: 'Text',
          email: 'example@example.com'
        })
      })
    })
  })

  describe('for a 1 day licence (non-physical)', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should set email, preferredMethodOfReminder and preferredMethodOfConfirmation in cache, when how-contacted is email', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '1D',
        licensee: {}
      }))

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
          licensee: expect.objectContaining({
            email: 'example@example.com',
            preferredMethodOfReminder: 'Email',
            preferredMethodOfConfirmation: 'Email'
          })
        })
      )
    })

    it('should set text, preferredMethodOfReminder and preferredMethodOfConfirmation in cache, when how-contacted is text', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '1D',
        licensee: {}
      }))

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
          licensee: expect.objectContaining({
            mobilePhone: '07700900088',
            preferredMethodOfReminder: 'Text',
            preferredMethodOfConfirmation: 'Text'
          })
        })
      )
    })

    it('should set email, text, preferredMethodOfReminder and preferredMethodOfConfirmation in cache when how-contacted is text and preferredMethodOfNewsletter is email', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '1D',
        licensee: {
          preferredMethodOfNewsletter: 'Email',
          email: 'example@example.com'
        }
      }))

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
          licensee: expect.objectContaining({
            email: 'example@example.com',
            mobilePhone: '07700900088',
            preferredMethodOfReminder: 'Text',
            preferredMethodOfConfirmation: 'Text'
          })
        })
      )
    })

    it('should set preferredMethodOfReminder and preferredMethodOfConfirmation in cache, when how-contacted is none', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '1D',
        licensee: {}
      }))

      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'none'
        }
      }))

      await updateTransaction(mockRequest)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '1D',
          licensee: expect.objectContaining({
            preferredMethodOfReminder: 'Prefer not to be contacted',
            preferredMethodOfConfirmation: 'Prefer not to be contacted'
          })
        })
      )
    })

    it('should set email, preferredMethodOfReminder and preferredMethodOfConfirmation in cache when how-contacted is none and preferredMethodOfNewsletter is email', async () => {
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '1D',
        licensee: {
          preferredMethodOfNewsletter: 'Email',
          email: 'example@example.com'
        }
      }))

      mockPageCacheGet.mockImplementationOnce(() => ({
        payload: {
          'how-contacted': 'none'
        }
      }))

      await updateTransaction(mockRequest)

      expect(mockTransactionCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceLength: '1D',
          licensee: expect.objectContaining({
            email: 'example@example.com',
            preferredMethodOfReminder: 'Prefer not to be contacted',
            preferredMethodOfConfirmation: 'Prefer not to be contacted'
          })
        })
      )
    })
  })
})
