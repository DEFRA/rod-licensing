import { salesApi } from '@defra-fish/connectors-lib'
import { COMPLETION_STATUS, RECURRING_PAYMENT } from '../../constants.js'
import agreedHandler from '../agreed-handler.js'
import { preparePayment, prepareRecurringPaymentAgreement } from '../../processors/payment.js'
import { sendPayment, sendRecurringPayment, getPaymentStatus } from '../../services/payment/govuk-pay-service.js'
import { prepareApiTransactionPayload } from '../../processors/api-transaction.js'
import { v4 as uuidv4 } from 'uuid'
import db from 'debug'

jest.mock('@defra-fish/connectors-lib')
jest.mock('../../processors/payment.js')
jest.mock('../../services/payment/govuk-pay-service.js', () => ({
  sendPayment: jest.fn(() => ({
    payment_id: 'payment-id-1',
    _links: {
      next_url: { href: 'next-url' },
      self: { href: 'self-url' }
    }
  })),
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

  const mockTransactionCacheSet = jest.fn()
  const getMockRequest = (overrides = {}) => ({
    cache: () => ({
      helpers: {
        transaction: {
          get: async () => ({ cost: 0 }),
          set: mockTransactionCacheSet
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
    redirect: jest.fn(),
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
      expect(prepareRecurringPaymentAgreement).toHaveBeenCalledWith(mockRequest, transaction)
    })

    it('adds a v4 guid to the transaction as an id', async () => {
      let transactionPayload = null
      prepareRecurringPaymentAgreement.mockImplementationOnce((_p1, tp) => {
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

    it('sends a recurring payment agreement creation request to Gov.UK Pay', async () => {
      const preparedPayment = Symbol('preparedPayment')
      prepareRecurringPaymentAgreement.mockResolvedValueOnce(preparedPayment)
      await agreedHandler(getMockRequest(), getRequestToolkit())
      expect(sendRecurringPayment).toHaveBeenCalledWith(preparedPayment)
    })

    describe('when there is a cost and recurringAgreement status is set to true', () => {
      beforeEach(() => {
        salesApi.createTransaction.mockResolvedValueOnce({
          id: 'transaction-id-1',
          cost: 100
        })
      })

      it('calls preparePayment with recurring as true', async () => {
        const transaction = { id: Symbol('transaction') }
        const request = getMockRequest({
          transaction: {
            get: async () => transaction,
            set: () => {}
          }
        })
        const toolkit = getRequestToolkit()

        await agreedHandler(request, toolkit)
        expect(preparePayment).toHaveBeenCalledWith(request, transaction, true)
      })

      it('calls sendPayment with recurring as true', async () => {
        const preparedPayment = Symbol('preparedPayment')
        preparePayment.mockReturnValueOnce(preparedPayment)

        await agreedHandler(getMockRequest(), getRequestToolkit())
        expect(sendPayment).toHaveBeenCalledWith(preparedPayment, true)
      })

      it('calls getPaymentStatus with recurring as true', async () => {
        const id = Symbol('paymentId')
        const transaction = { id: '123', payment: { payment_id: id } }
        const request = getMockRequest({
          transaction: {
            get: async () => transaction,
            set: () => {}
          },
          status: {
            get: async () => ({
              [COMPLETION_STATUS.agreed]: true,
              [COMPLETION_STATUS.posted]: false,
              [COMPLETION_STATUS.finalised]: true,
              [RECURRING_PAYMENT]: true,
              [COMPLETION_STATUS.paymentCreated]: true
            }),
            set: () => {}
          }
        })
        const toolkit = getRequestToolkit()

        getPaymentStatus.mockReturnValueOnce({ state: { finished: true, status: 'success' } })

        await agreedHandler(request, toolkit)
        expect(getPaymentStatus).toHaveBeenCalledWith(id, true)
      })
    })

    // this doesn't really belong here, but until the other agreed handler tests are refactored to
    // not use injectWithCookies, it'll have to live here
    it('sends the generated guid to the sales api, rather than requesting it from the sales api', async () => {
      const v4guid = Symbol('v4guid')
      uuidv4.mockReturnValue(v4guid)

      await agreedHandler(getMockRequest(), getRequestToolkit())

      expect(prepareApiTransactionPayload).toHaveBeenCalledWith(expect.any(Object), v4guid, undefined)
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

    it.each(['zxy-098-wvu-765', '467482f1-099d-403d-b6b3-8db7e70d19e3'])(
      "assigns agreement id '%s' to the transaction when recurring payment agreement created",
      async agreementId => {
        sendRecurringPayment.mockResolvedValueOnce({
          agreement_id: agreementId
        })

        await agreedHandler(getMockRequest(), getRequestToolkit())

        expect(mockTransactionCacheSet).toHaveBeenCalledWith(
          expect.objectContaining({
            agreementId
          })
        )
      }
    )
  })
})
