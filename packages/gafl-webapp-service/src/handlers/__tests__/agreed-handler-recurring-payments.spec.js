import { salesApi } from '@defra-fish/connectors-lib'
import { COMPLETION_STATUS, RECURRING_PAYMENT } from '../../constants.js'
import agreedHandler from '../agreed-handler.js'
import { prepareRecurringPayment } from '../../processors/payment.js'
import { sendRecurringPayment } from '../../services/payment/govuk-pay-service.js'
import { prepareApiTransactionPayload } from '../../processors/api-transaction.js'
import { v4 as uuidv4 } from 'uuid'
import db from 'debug'

jest.mock('@defra-fish/connectors-lib')
jest.mock('../../processors/payment.js')
jest.mock('../../services/payment/govuk-pay-service.js', () => ({
  sendPayment: jest.fn(),
  getPaymentStatus: jest.fn(),
  sendRecurringPayment: jest.fn(() => ({ agreementId: 'agr-eem-ent-id1' }))
}))
jest.mock('../../processors/api-transaction.js')
jest.mock('@defra-fish/connectors-lib')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'abc-123-def-456')
}))
jest.mock('debug', () => jest.fn(() => jest.fn()))

const debugMock = db.mock.results[0].value

describe('The agreed handler', () => {
  beforeAll(() => {
    salesApi.createTransaction.mockResolvedValue({
      id: 'transaction-id-1',
      cost: 0
    })
  })
  beforeEach(jest.clearAllMocks)

  const getMockRequest = (overrides = {}) => ({
    cache: () => ({
      helpers: {
        transaction: {
          get: async () => ({ id: 'id-111', cost: 0 }),
          set: async () => {}
        },
        status: {
          get: async () => ({
            [COMPLETION_STATUS.agreed]: true,
            [COMPLETION_STATUS.posted]: false,
            [COMPLETION_STATUS.finalised]: true,
            [RECURRING_PAYMENT]: true
          }),
          set: jest.fn()
        },
        ...overrides
      }
    })
  })

  const getRequestToolkit = () => ({
    redirectWithLanguageCode: jest.fn()
  })

  describe('recurring card payments', () => {
    it('sends the request and transaction to prepare the recurring payment', async () => {
      const transaction = { cost: 0 }
      const mockRequest = getMockRequest({
        transaction: {
          get: async () => transaction,
          set: () => {}
        }
      })
      await agreedHandler(mockRequest, getRequestToolkit())
      expect(prepareRecurringPayment).toHaveBeenCalledWith(mockRequest, transaction)
    })

    it('adds a v4 guid to the transaction as an id', async () => {
      let transactionPayload = null
      prepareRecurringPayment.mockImplementationOnce((_p1, tp) => {
        transactionPayload = { ...tp }
      })
      const v4guid = Symbol('v4guid')
      uuidv4.mockReturnValue(v4guid)
      const transaction = { cost: 0 }
      const mockRequest = getMockRequest({
        transaction: {
          get: async () => transaction,
          set: () => {}
        }
      })

      await agreedHandler(mockRequest, getRequestToolkit())

      expect(transactionPayload.id).toBe(v4guid)
    })

    it('sends a recurring payment creation request to Gov.UK Pay', async () => {
      const preparedPayment = Symbol('preparedPayment')
      prepareRecurringPayment.mockResolvedValueOnce(preparedPayment)
      await agreedHandler(getMockRequest(), getRequestToolkit())
      expect(sendRecurringPayment).toHaveBeenCalledWith(preparedPayment)
    })

    // this doesn't really belong here, but until the other agreed handler tests are refactored to
    // not use injectWithCookies, it'll have to live here
    it('sends the generated guid to the sales api, rather than requesting it from the sales api', async () => {
      const v4guid = Symbol('v4guid')
      uuidv4.mockReturnValue(v4guid)

      await agreedHandler(getMockRequest(), getRequestToolkit())

      expect(prepareApiTransactionPayload).toHaveBeenCalledWith(expect.any(Object), v4guid)
    })

    it.each(['zxy-098-wvu-765', '467482f1-099d-403d-b6b3-8db7e70d19e3'])(
      "logs out agreement id '%s' when recurring payment agreement created",
      // eslint-disable-next-line camelcase
      async agreement_id => {
        sendRecurringPayment.mockResolvedValueOnce({
          // eslint-disable-next-line camelcase
          agreement_id
        })

        await agreedHandler(getMockRequest(), getRequestToolkit())

        // eslint-disable-next-line camelcase
        expect(debugMock).toHaveBeenCalledWith(`Created agreement with id ${agreement_id}`)
      }
    )
  })
})
