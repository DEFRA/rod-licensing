import { salesApi } from '@defra-fish/connectors-lib'
import { prepareApiTransactionPayload, prepareApiFinalisationPayload } from '../../processors/api-transaction.js'
import { sendPayment, getPaymentStatus, sendRecurringPayment } from '../../services/payment/govuk-pay-service.js'
import { preparePayment, prepareRecurringPaymentAgreement } from '../../processors/payment.js'
import { COMPLETION_STATUS, RECURRING_PAYMENT } from '../../constants.js'
import { ORDER_COMPLETE, PAYMENT_CANCELLED, PAYMENT_FAILED, CONTROLLER } from '../../uri.js'
import { PAYMENT_JOURNAL_STATUS_CODES, GOVUK_PAY_ERROR_STATUS_CODES } from '@defra-fish/business-rules-lib'
import agreedHandler from '../agreed-handler.js'
import Boom from '@hapi/boom'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    createTransaction: jest.fn(),
    finaliseTransaction: jest.fn(),
    getPaymentJournal: jest.fn(),
    createPaymentJournal: jest.fn(),
    updatePaymentJournal: jest.fn()
  }
}))
jest.mock('../../processors/api-transaction.js')
jest.mock('../../services/payment/govuk-pay-service.js')
jest.mock('../../processors/payment.js')

describe('agreed-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getMockRequest = (overrides = {}) => {
    const defaults = {
      cache: () => ({
        helpers: {
          transaction: {
            get: jest.fn(async () => ({ id: 'test-transaction-id', cost: 0, permissions: [] })),
            set: jest.fn(async () => {})
          },
          status: {
            get: jest.fn(async () => ({ [COMPLETION_STATUS.agreed]: true })),
            set: jest.fn(async () => {})
          }
        }
      })
    }
    return { ...defaults, ...overrides }
  }

  const getMockResponseToolkit = () => ({
    redirect: jest.fn(uri => ({ uri })),
    redirectWithLanguageCode: jest.fn(uri => ({ uri }))
  })

  describe('main handler', () => {
    describe('when agreed flag is not set', () => {
      it('throws a 403 Forbidden error', async () => {
        const request = getMockRequest({
          cache: () => ({
            helpers: {
              transaction: {
                get: jest.fn(async () => ({ id: 'test-id' }))
              },
              status: {
                get: jest.fn(async () => ({ [COMPLETION_STATUS.agreed]: false }))
              }
            }
          })
        })
        const h = getMockResponseToolkit()

        await expect(agreedHandler(request, h)).rejects.toThrow(Boom.Forbidden)
      })
    })

    describe('when transaction has no id', () => {
      it('generates a new transaction id', async () => {
        const mockTransactionSet = jest.fn(async () => {})
        const mockTransactionGet = jest.fn(async () => ({ cost: 0, permissions: [] }))
        const request = getMockRequest({
          cache: () => ({
            helpers: {
              transaction: {
                get: mockTransactionGet,
                set: mockTransactionSet
              },
              status: {
                get: jest.fn(async () => ({
                  [COMPLETION_STATUS.agreed]: true,
                  [COMPLETION_STATUS.posted]: false // Not posted yet, so sendToSalesApi will be called
                })),
                set: jest.fn(async () => {})
              }
            }
          })
        })
        const h = getMockResponseToolkit()

        prepareApiTransactionPayload.mockResolvedValueOnce({})
        salesApi.createTransaction.mockResolvedValueOnce({ cost: 0, permissions: [] })
        prepareApiFinalisationPayload.mockResolvedValueOnce({})
        salesApi.finaliseTransaction.mockResolvedValueOnce({ permissions: [] })

        await agreedHandler(request, h)

        expect(mockTransactionSet).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String)
          })
        )
      })
    })
  })

  describe('zero-cost transaction journey', () => {
    describe('skips payment and goes straight to finalization', () => {
      let mockStatusSet, request, h

      beforeEach(async () => {
        mockStatusSet = jest.fn(async () => {})
        const mockTransactionSet = jest.fn(async () => {})
        request = getMockRequest({
          cache: () => ({
            helpers: {
              transaction: {
                get: jest.fn(async () => ({
                  id: 'test-id',
                  cost: 0,
                  permissions: [{ licensee: {} }]
                })),
                set: mockTransactionSet
              },
              status: {
                get: jest.fn(async () => ({
                  [COMPLETION_STATUS.agreed]: true,
                  [COMPLETION_STATUS.posted]: false
                })),
                set: mockStatusSet
              }
            }
          })
        })
        h = getMockResponseToolkit()

        prepareApiTransactionPayload.mockResolvedValue({})
        salesApi.createTransaction.mockResolvedValue({ cost: 0, permissions: [] })
        prepareApiFinalisationPayload.mockResolvedValue({})
        salesApi.finaliseTransaction.mockResolvedValue({
          permissions: [
            {
              referenceNumber: 'REF123',
              issueDate: '2024-01-01',
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              licensee: { obfuscatedDob: '01/01' }
            }
          ]
        })

        await agreedHandler(request, h)
      })

      it('sets posted and finalised status flags', () => {
        expect(mockStatusSet).toHaveBeenCalledWith(
          expect.objectContaining({
            [COMPLETION_STATUS.posted]: true,
            [COMPLETION_STATUS.finalised]: true
          })
        )
      })

      it('redirects to order complete', () => {
        expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(ORDER_COMPLETE.uri)
      })
    })

    describe('does not create payment journal for zero-cost transaction', () => {
      beforeEach(async () => {
        const request = getMockRequest({
          cache: () => ({
            helpers: {
              transaction: {
                get: jest.fn(async () => ({ id: 'test-id', cost: 0, permissions: [{ licensee: {} }] })),
                set: jest.fn(async () => {})
              },
              status: {
                get: jest.fn(async () => ({
                  [COMPLETION_STATUS.agreed]: true,
                  [COMPLETION_STATUS.posted]: false
                })),
                set: jest.fn(async () => {})
              }
            }
          })
        })
        const h = getMockResponseToolkit()

        prepareApiTransactionPayload.mockResolvedValue({})
        salesApi.createTransaction.mockResolvedValue({ cost: 0, permissions: [] })
        prepareApiFinalisationPayload.mockResolvedValue({})
        salesApi.finaliseTransaction.mockResolvedValue({ permissions: [{ licensee: {} }] })

        await agreedHandler(request, h)
      })

      it('does not call createPaymentJournal', () => {
        expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()
      })

      it('does not call updatePaymentJournal', () => {
        expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
      })
    })
  })

  describe('paid transaction journey', () => {
    describe('initial call - creates payment', () => {
      describe('posts to sales API and creates payment', () => {
        let request, h

        beforeEach(async () => {
          request = getMockRequest({
            cache: () => ({
              helpers: {
                transaction: {
                  get: jest.fn(async () => ({ id: 'test-id', cost: 100, permissions: [] })),
                  set: jest.fn(async () => {})
                },
                status: {
                  get: jest.fn(async () => ({
                    [COMPLETION_STATUS.agreed]: true,
                    [COMPLETION_STATUS.posted]: false
                  })),
                  set: jest.fn(async () => {})
                }
              }
            })
          })
          h = getMockResponseToolkit()

          prepareApiTransactionPayload.mockResolvedValue({})
          salesApi.createTransaction.mockResolvedValue({ cost: 100, permissions: [] })
          preparePayment.mockReturnValue({})
          sendPayment.mockResolvedValue({
            payment_id: 'pay123',
            created_date: '2024-01-01',
            state: { status: 'created' },
            payment_provider: 'worldpay',
            _links: {
              next_url: { href: 'https://pay.gov.uk/payment' },
              self: { href: 'https://api/payment' }
            }
          })
          salesApi.getPaymentJournal.mockResolvedValue(false)

          await agreedHandler(request, h)
        })

        it('posts transaction to sales API', () => {
          expect(salesApi.createTransaction).toHaveBeenCalled()
        })

        it('sends payment to GOV.UK Pay', () => {
          expect(sendPayment).toHaveBeenCalled()
        })

        it('redirects to payment page', () => {
          expect(h.redirect).toHaveBeenCalledWith('https://pay.gov.uk/payment')
        })
      })

      it('creates payment journal when it does not exist', async () => {
        const request = getMockRequest({
          cache: () => ({
            helpers: {
              transaction: {
                get: jest.fn(async () => ({ id: 'test-id', cost: 100, permissions: [] })),
                set: jest.fn(async () => {})
              },
              status: {
                get: jest.fn(async () => ({
                  [COMPLETION_STATUS.agreed]: true,
                  [COMPLETION_STATUS.posted]: false
                })),
                set: jest.fn(async () => {})
              }
            }
          })
        })
        const h = getMockResponseToolkit()

        prepareApiTransactionPayload.mockResolvedValueOnce({})
        salesApi.createTransaction.mockResolvedValueOnce({ cost: 100, permissions: [] })
        preparePayment.mockReturnValueOnce({})
        sendPayment.mockResolvedValueOnce({
          payment_id: 'pay123',
          created_date: '2024-01-01T10:00:00Z',
          state: {},
          payment_provider: 'worldpay',
          _links: { next_url: { href: 'url' }, self: { href: 'self' } }
        })
        salesApi.getPaymentJournal.mockResolvedValueOnce(false)

        await agreedHandler(request, h)

        expect(salesApi.createPaymentJournal).toHaveBeenCalledWith('test-id', {
          paymentReference: 'pay123',
          paymentTimestamp: '2024-01-01T10:00:00Z',
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
        })
      })

      describe('updates payment journal when it already exists', () => {
        beforeEach(async () => {
          const request = getMockRequest({
            cache: () => ({
              helpers: {
                transaction: {
                  get: jest.fn(async () => ({ id: 'test-id', cost: 100, permissions: [] })),
                  set: jest.fn(async () => {})
                },
                status: {
                  get: jest.fn(async () => ({
                    [COMPLETION_STATUS.agreed]: true,
                    [COMPLETION_STATUS.posted]: false
                  })),
                  set: jest.fn(async () => {})
                }
              }
            })
          })
          const h = getMockResponseToolkit()

          prepareApiTransactionPayload.mockResolvedValue({})
          salesApi.createTransaction.mockResolvedValue({ cost: 100, permissions: [] })
          preparePayment.mockReturnValue({})
          sendPayment.mockResolvedValue({
            payment_id: 'pay456',
            created_date: '2024-01-02T10:00:00Z',
            state: {},
            payment_provider: 'worldpay',
            _links: { next_url: { href: 'url' }, self: { href: 'self' } }
          })
          salesApi.getPaymentJournal.mockResolvedValue(true)

          await agreedHandler(request, h)
        })

        it('updates the payment journal', () => {
          expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('test-id', {
            paymentReference: 'pay456',
            paymentTimestamp: '2024-01-02T10:00:00Z',
            paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
          })
        })

        it('does not create a new payment journal', () => {
          expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()
        })
      })
    })

    describe('return from payment - successful payment', () => {
      let mockStatusSet, request, h

      beforeEach(async () => {
        mockStatusSet = jest.fn(async () => {})
        request = getMockRequest({
          cache: () => ({
            helpers: {
              transaction: {
                get: jest.fn(async () => ({
                  id: 'test-id',
                  cost: 100,
                  permissions: [{ licensee: {} }],
                  payment: { payment_id: 'pay123' }
                })),
                set: jest.fn(async () => {})
              },
              status: {
                get: jest.fn(async () => ({
                  [COMPLETION_STATUS.agreed]: true,
                  [COMPLETION_STATUS.posted]: true,
                  [COMPLETION_STATUS.paymentCreated]: true
                })),
                set: mockStatusSet
              }
            }
          })
        })
        h = getMockResponseToolkit()

        getPaymentStatus.mockResolvedValue({
          state: { status: 'success', finished: true }
        })
        prepareApiFinalisationPayload.mockResolvedValue({})
        salesApi.finaliseTransaction.mockResolvedValue({
          permissions: [
            {
              referenceNumber: 'REF123',
              issueDate: '2024-01-01',
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              licensee: { obfuscatedDob: '01/01' }
            }
          ]
        })

        await agreedHandler(request, h)
      })

      it('sets paymentCompleted and finalised status flags', () => {
        expect(mockStatusSet).toHaveBeenCalledWith(
          expect.objectContaining({
            [COMPLETION_STATUS.paymentCompleted]: true,
            [COMPLETION_STATUS.finalised]: true
          })
        )
      })

      it('updates payment journal as completed', () => {
        expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('test-id', {
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed
        })
      })

      it('redirects to order complete', () => {
        expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(ORDER_COMPLETE.uri)
      })
    })

    describe('return from payment - cancelled payment', () => {
      let mockStatusSet, request, h

      beforeEach(async () => {
        mockStatusSet = jest.fn(async () => {})
        request = getMockRequest({
          cache: () => ({
            helpers: {
              transaction: {
                get: jest.fn(async () => ({
                  id: 'test-id',
                  cost: 100,
                  payment: { payment_id: 'pay123' }
                })),
                set: jest.fn(async () => {})
              },
              status: {
                get: jest.fn(async () => ({
                  [COMPLETION_STATUS.agreed]: true,
                  [COMPLETION_STATUS.posted]: true,
                  [COMPLETION_STATUS.paymentCreated]: true
                })),
                set: mockStatusSet
              }
            }
          })
        })
        h = getMockResponseToolkit()

        getPaymentStatus.mockResolvedValue({
          state: {
            status: 'cancelled',
            finished: true,
            code: GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED
          }
        })

        await agreedHandler(request, h)
      })

      it('sets paymentCancelled status flag', () => {
        expect(mockStatusSet).toHaveBeenCalledWith(
          expect.objectContaining({
            [COMPLETION_STATUS.paymentCancelled]: true
          })
        )
      })

      it('updates payment journal as cancelled', () => {
        expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('test-id', {
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Cancelled
        })
      })

      it('redirects to payment cancelled page', () => {
        expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_CANCELLED.uri)
      })
    })

    describe('return from payment - failed payment', () => {
      describe.each([
        ['expired', GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED],
        ['rejected', GOVUK_PAY_ERROR_STATUS_CODES.REJECTED]
      ])('when payment is %s', (description, code) => {
        let mockStatusSet, request, h

        beforeEach(async () => {
          mockStatusSet = jest.fn(async () => {})
          request = getMockRequest({
            cache: () => ({
              helpers: {
                transaction: {
                  get: jest.fn(async () => ({
                    id: 'test-id',
                    cost: 100,
                    payment: { payment_id: 'pay123' }
                  })),
                  set: jest.fn(async () => {})
                },
                status: {
                  get: jest.fn(async () => ({
                    [COMPLETION_STATUS.agreed]: true,
                    [COMPLETION_STATUS.posted]: true,
                    [COMPLETION_STATUS.paymentCreated]: true
                  })),
                  set: mockStatusSet
                }
              }
            })
          })
          h = getMockResponseToolkit()

          getPaymentStatus.mockResolvedValue({
            state: { status: 'failed', finished: true, code }
          })

          await agreedHandler(request, h)
        })

        it('sets paymentFailed status flag', () => {
          expect(mockStatusSet).toHaveBeenCalledWith(
            expect.objectContaining({
              [COMPLETION_STATUS.paymentFailed]: true
            })
          )
        })

        it('updates payment journal as failed', () => {
          expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('test-id', {
            paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed
          })
        })

        it('redirects to payment failed page', () => {
          expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_FAILED.uri)
        })
      })

      describe('when status is error', () => {
        let mockStatusSet, request, h

        beforeEach(async () => {
          mockStatusSet = jest.fn(async () => {})
          request = getMockRequest({
            cache: () => ({
              helpers: {
                transaction: {
                  get: jest.fn(async () => ({
                    id: 'test-id',
                    cost: 100,
                    payment: { payment_id: 'pay123' }
                  })),
                  set: jest.fn(async () => {})
                },
                status: {
                  get: jest.fn(async () => ({
                    [COMPLETION_STATUS.agreed]: true,
                    [COMPLETION_STATUS.posted]: true,
                    [COMPLETION_STATUS.paymentCreated]: true
                  })),
                  set: mockStatusSet
                }
              }
            })
          })
          h = getMockResponseToolkit()

          getPaymentStatus.mockResolvedValue({
            state: { status: 'error', finished: true, code: 'P0050' }
          })

          await agreedHandler(request, h)
        })

        it('sets paymentFailed status flag', () => {
          expect(mockStatusSet).toHaveBeenCalledWith(
            expect.objectContaining({
              [COMPLETION_STATUS.paymentFailed]: true
            })
          )
        })

        it('redirects to payment failed page', () => {
          expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_FAILED.uri)
        })
      })
    })
  })

  describe('recurring payment flow', () => {
    let mockStatusSet, mockTransactionSet, request, h

    beforeEach(async () => {
      mockStatusSet = jest.fn(async () => {})
      mockTransactionSet = jest.fn(async () => {})
      request = getMockRequest({
        cache: () => ({
          helpers: {
            transaction: {
              get: jest.fn(async () => ({ id: 'test-id', cost: 100, permissions: [] })),
              set: mockTransactionSet
            },
            status: {
              get: jest.fn(async () => ({
                [COMPLETION_STATUS.agreed]: true,
                [COMPLETION_STATUS.posted]: false,
                [RECURRING_PAYMENT]: true
              })),
              set: mockStatusSet
            }
          }
        })
      })
      h = getMockResponseToolkit()

      prepareRecurringPaymentAgreement.mockResolvedValue({})
      sendRecurringPayment.mockResolvedValue({ agreement_id: 'agr123' })
      prepareApiTransactionPayload.mockResolvedValue({})
      salesApi.createTransaction.mockResolvedValue({ cost: 100, permissions: [] })
      preparePayment.mockReturnValue({})
      sendPayment.mockResolvedValue({
        payment_id: 'pay123',
        created_date: '2024-01-01',
        state: {},
        payment_provider: 'worldpay',
        _links: { next_url: { href: 'url' }, self: { href: 'self' } }
      })
      salesApi.getPaymentJournal.mockResolvedValue(false)

      await agreedHandler(request, h)
    })

    it('sends recurring payment agreement', () => {
      expect(sendRecurringPayment).toHaveBeenCalled()
    })

    it('sets recurringAgreement status flag', () => {
      expect(mockStatusSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [COMPLETION_STATUS.recurringAgreement]: true
        })
      )
    })

    it('stores agreement ID in transaction', () => {
      expect(mockTransactionSet).toHaveBeenCalledWith(
        expect.objectContaining({
          agreementId: 'agr123'
        })
      )
    })

    it('sends payment with recurring flag', () => {
      expect(sendPayment).toHaveBeenCalledWith(expect.anything(), true)
    })
  })

  describe('idempotency', () => {
    describe('when already finalised', () => {
      let request, h

      beforeEach(async () => {
        request = getMockRequest({
          cache: () => ({
            helpers: {
              transaction: {
                get: jest.fn(async () => ({ id: 'test-id', cost: 0, permissions: [] })),
                set: jest.fn(async () => {})
              },
              status: {
                get: jest.fn(async () => ({
                  [COMPLETION_STATUS.agreed]: true,
                  [COMPLETION_STATUS.posted]: true,
                  [COMPLETION_STATUS.finalised]: true
                })),
                set: jest.fn(async () => {})
              }
            }
          })
        })
        h = getMockResponseToolkit()

        await agreedHandler(request, h)
      })

      it('does not call finaliseTransaction', () => {
        expect(salesApi.finaliseTransaction).not.toHaveBeenCalled()
      })

      it('redirects to order complete', () => {
        expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(ORDER_COMPLETE.uri)
      })
    })
  })

  describe('error handling', () => {
    it('throws error when sales API fails', async () => {
      const request = getMockRequest({
        cache: () => ({
          helpers: {
            transaction: {
              get: jest.fn(async () => ({ id: 'test-id', cost: 0, permissions: [] })),
              set: jest.fn(async () => {})
            },
            status: {
              get: jest.fn(async () => ({
                [COMPLETION_STATUS.agreed]: true,
                [COMPLETION_STATUS.posted]: false
              })),
              set: jest.fn(async () => {})
            }
          }
        })
      })
      const h = getMockResponseToolkit()

      prepareApiTransactionPayload.mockResolvedValueOnce({})
      salesApi.createTransaction.mockRejectedValueOnce(new Error('API Error'))

      await expect(agreedHandler(request, h)).rejects.toThrow('API Error')
    })

    it('throws forbidden error when payment is not finished', async () => {
      const request = getMockRequest({
        cache: () => ({
          helpers: {
            transaction: {
              get: jest.fn(async () => ({
                id: 'test-id',
                cost: 100,
                payment: { payment_id: 'pay123' }
              })),
              set: jest.fn(async () => {})
            },
            status: {
              get: jest.fn(async () => ({
                [COMPLETION_STATUS.agreed]: true,
                [COMPLETION_STATUS.posted]: true,
                [COMPLETION_STATUS.paymentCreated]: true
              })),
              set: jest.fn(async () => {})
            }
          }
        })
      })
      const h = getMockResponseToolkit()

      getPaymentStatus.mockResolvedValueOnce({
        state: { status: 'started', finished: false }
      })

      await expect(agreedHandler(request, h)).rejects.toThrow(Boom.Forbidden)
    })
  })

  describe('missing session data', () => {
    it.each([
      ['transaction is null', null, {}],
      ['status is null', {}, null],
      ['both transaction and status are null', null, null]
    ])('redirects to the controller when %s', async (_, transaction, status) => {
      const h = getMockResponseToolkit()
      const request = getMockRequest({
        cache: () => ({
          helpers: {
            transaction: { get: async () => transaction },
            status: { get: async () => status }
          }
        })
      })
      await agreedHandler(request, h)
      expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CONTROLLER.uri)
    })
  })
})
