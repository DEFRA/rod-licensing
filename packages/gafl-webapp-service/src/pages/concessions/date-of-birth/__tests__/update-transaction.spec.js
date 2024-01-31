import { DATE_OF_BIRTH } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'
import { ageConcessionHelper } from '@defra-fish/business-rules-lib'
import { onLengthChange } from '../../../licence-details/licence-length/update-transaction.js'

jest.mock('@defra-fish/business-rules-lib', () => ({
  ageConcessionHelper: jest.fn()
}))

jest.mock('../../../licence-details/licence-length/update-transaction.js', () => ({
  onLengthChange: jest.fn()
}))

const VALID_PAYLOAD = {
  'date-of-birth-year': '1985',
  'date-of-birth-month': '1',
  'date-of-birth-day': '1'
}

const transactionHelperMock = {
  get: jest.fn(),
  getCurrentPermission: jest.fn(() => ({ licensee: {} })),
  setCurrentPermission: jest.fn()
}

describe('updateTransaction', () => {
  beforeEach(jest.clearAllMocks)

  describe('happy path', () => {
    let request
    beforeEach(async () => {
      request = createRequestMock(VALID_PAYLOAD)
      await updateTransaction(request)
    })

    it('gets the payload from the page cache', async () => {
      expect(request.cache.mock.results[0].value.helpers.page.getCurrentPermission).toBeCalledWith(DATE_OF_BIRTH.page)
    })

    it('gets the current permission', async () => {
      expect(transactionHelperMock.getCurrentPermission).toBeCalled()
    })

    it('calls the age concession helper', async () => {
      expect(ageConcessionHelper).toBeCalled()
    })

    it('calls on length change', async () => {
      expect(onLengthChange).toBeCalled()
    })

    it('sets the birth date on the current permission', async () => {
      const [[permission]] = transactionHelperMock.setCurrentPermission.mock.calls
      expect(permission.licensee.birthDate).toBe('1985-01-01')
    })
  })
})

const createRequestMock = payload => ({
  cache: jest.fn(() => ({
    helpers: {
      page: {
        get: jest.fn(() => ({
          permissions: [
            {
              [DATE_OF_BIRTH.page]: {
                payload: VALID_PAYLOAD
              }
            }
          ]
        })),
        getCurrentPermission: jest.fn(() => ({ payload: payload || { test: 'payload' } }))
      },
      status: {
        get: jest.fn()
      },
      transaction: transactionHelperMock
    }
  }))
})
