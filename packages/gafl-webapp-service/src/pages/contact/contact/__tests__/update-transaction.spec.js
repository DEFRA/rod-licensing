import updateTransaction from '../update-transaction'
import { isPhysical } from '../../../../processors/licence-type-display.js'

jest.mock('../../../../processors/licence-type-display.js')

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

  describe('for a 12 month licence (physical)', () => {
    it.each([
      ['none', 'Letter', 'not set email or mobilePhone'],
      ['email', 'Email', 'set email', { email }, [email]],
      ['text', 'Text', 'set mobilePhone', { mobilePhone }, [null, mobilePhone]],
      ['email', 'Email', 'set email and mobilePhone when both are provided', { email, mobilePhone }, [email], [{ mobilePhone }]],
      ['text', 'Text', 'set mobilePhone and email if both are provided', { email, mobilePhone }, [null, mobilePhone], [{ email }]],
      [
        'text',
        'Text',
        'set mobilePhone and email when both are provided, and preserve the original email if a different email is passed in',
        { email, mobilePhone },
        ['someone@example.com', mobilePhone],
        [{ email }]
      ]
    ])(
      'when how-contacted is %s, should set preferredMethodOfReminder to "%s" and %s',
      async (howContacted, preferredMethod, _desc, expectedLicencee = {}, pagePermissionArgs = [], transactionPermissionArgs = []) => {
        const licenceLength = '12M'
        isPhysical.mockReturnValue(true)
        const pagePermission = getPagePermission(howContacted, ...pagePermissionArgs)
        const transactionPermission = getTransactionPermission(licenceLength, ...transactionPermissionArgs)
        const request = getMockRequest(pagePermission, transactionPermission)

        await updateTransaction(request)

        const method = mockTransactionCacheSet.mock.calls[0]
        expect(method[0]).toMatchObject({
          licenceLength,
          licensee: expect.objectContaining({
            preferredMethodOfReminder: preferredMethod,
            ...expectedLicencee
          })
        })
        expect(method[0]).not.toHaveProperty('licensee.preferredMethodOfConfirmation')
      }
    )
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
        isPhysical.mockReturnValue(false)
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
        isPhysical.mockReturnValue(false)
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
