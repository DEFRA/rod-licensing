import updateTransaction from '../update-transaction'

describe('contact > update-transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockTransactionCacheSet = jest.fn()

  const email = 'example@example.com'
  const mobilePhone = '07700900088'

  const getPagePermission = (contactMethod, email, text) => ({
    payload: { 'how-contacted': contactMethod, email, text }
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
        }
      }
    })
  })

  describe('for a 12 month licence (non-physical)', () => {
    it.each([
      ['none', 'Prefer not to be contacted', 'not set email or mobilePhone', {}, [], [{ licenceLength: '12M' }]],
      ['email', 'Email', 'set email', { email }, [email], [{ licenceLength: '12M' }]],
      ['text', 'Text', 'set mobilePhone', { mobilePhone }, [null, mobilePhone], [{ licenceLength: '12M' }]],
      [
        'none',
        'Prefer not to be contacted',
        'set email when preferredMethodOfNewsletter is email',
        { email },
        [email],
        [{ preferredMethodOfNewsletter: 'Email', email, licenceLength: '12M' }]
      ],
      [
        'text',
        'Text',
        'set text, and set email when preferredMethodOfNewsletter is email',
        { email, mobilePhone },
        [null, mobilePhone],
        [{ preferredMethodOfNewsletter: 'Email', email, licenceLength: '12M' }]
      ]
    ])(
      'when how-contacted is %s, should set preferredMethodOfReminder and preferredMethodOfConfirmation to "%s" and %s',
      async (howContacted, preferredMethod, _desc, expectedLicencee = {}, pagePermissionArgs = [], transactionPermissionArgs = []) => {
        const licenceLength = '12M'
        const pagePermission = getPagePermission(howContacted, ...pagePermissionArgs)
        const transactionPermission = getTransactionPermission(licenceLength, ...transactionPermissionArgs)
        const request = getMockRequest(pagePermission, transactionPermission)

        await updateTransaction(request)

        expect(mockTransactionCacheSet).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceLength,
            licensee: expect.objectContaining({
              preferredMethodOfConfirmation: preferredMethod,
              shortTermPreferredMethodOfConfirmation: preferredMethod,
              preferredMethodOfReminder: preferredMethod,
              ...expectedLicencee
            })
          })
        )
      }
    )
  })

  describe('for a 1 day licence (non-physical)', () => {
    it.each([
      ['none', 'Prefer not to be contacted', 'not set email or mobilePhone'],
      ['email', 'Email', 'set email', { email }, [email]],
      ['text', 'Text', 'set mobilePhone', { mobilePhone }, [null, mobilePhone]],
      [
        'none',
        'Prefer not to be contacted',
        'set email when preferredMethodOfNewsletter is email',
        { email },
        [email],
        [{ preferredMethodOfNewsletter: 'Email', email }]
      ],
      [
        'text',
        'Text',
        'set text, and set email when preferredMethodOfNewsletter is email',
        { email, mobilePhone },
        [null, mobilePhone],
        [{ preferredMethodOfNewsletter: 'Email', email }]
      ]
    ])(
      'when how-contacted is %s, should set preferredMethodOfReminder and preferredMethodOfConfirmation to "%s" and %s',
      async (howContacted, preferredMethod, _desc, expectedLicencee = {}, pagePermissionArgs = [], transactionPermissionArgs = []) => {
        const licenceLength = '1D'
        const pagePermission = getPagePermission(howContacted, ...pagePermissionArgs)
        const transactionPermission = getTransactionPermission(licenceLength, ...transactionPermissionArgs)
        const request = getMockRequest(pagePermission, transactionPermission)

        await updateTransaction(request)

        expect(mockTransactionCacheSet).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceLength,
            licensee: expect.objectContaining({
              shortTermPreferredMethodOfConfirmation: preferredMethod,
              preferredMethodOfReminder: preferredMethod,
              ...expectedLicencee
            })
          })
        )
      }
    )
  })
})
