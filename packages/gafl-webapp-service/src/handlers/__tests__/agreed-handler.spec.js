import agreedHandler from '../agreed-handler.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { prepareApiTransactionPayload, prepareApiFinalisationPayload } from '../../processors/api-transaction.js'
import { sendPayment, getPaymentStatus, sendRecurringPayment } from '../../services/payment/govuk-pay-service.js'
import { preparePayment, prepareRecurringPaymentAgreement } from '../../processors/payment.js'
import { COMPLETION_STATUS, RECURRING_PAYMENT } from '../../constants.js'
import { ORDER_COMPLETE, PAYMENT_CANCELLED, PAYMENT_FAILED } from '../../uri.js'
import { PAYMENT_JOURNAL_STATUS_CODES, GOVUK_PAY_ERROR_STATUS_CODES } from '@defra-fish/business-rules-lib'
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

  /**
   * Helper to create a mock request object
   * Override any properties by passing an object with the desired values
   */
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

  /**
   * Helper to create a mock response toolkit
   */
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

        // Mock the API call so it doesn't fail
        prepareApiTransactionPayload.mockResolvedValue({})
        salesApi.createTransaction.mockResolvedValue({ cost: 0, permissions: [] })
        prepareApiFinalisationPayload.mockResolvedValue({})
        salesApi.finaliseTransaction.mockResolvedValue({ permissions: [] })

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
    it('skips payment and goes straight to finalization', async () => {
      const mockStatusSet = jest.fn(async () => {})
      const mockTransactionSet = jest.fn(async () => {})
      const request = getMockRequest({
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
      const h = getMockResponseToolkit()

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

      expect(mockStatusSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [COMPLETION_STATUS.posted]: true,
          [COMPLETION_STATUS.finalised]: true
        })
      )
      expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(ORDER_COMPLETE.uri)
    })

    it('does not create payment journal for zero-cost transaction', async () => {
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

      expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()
      expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
    })
  })

  describe('paid transaction journey', () => {
    describe('initial call - creates payment', () => {
      it('posts to sales API and creates payment', async () => {
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

        expect(salesApi.createTransaction).toHaveBeenCalled()
        expect(sendPayment).toHaveBeenCalled()
        expect(h.redirect).toHaveBeenCalledWith('https://pay.gov.uk/payment')
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

        prepareApiTransactionPayload.mockResolvedValue({})
        salesApi.createTransaction.mockResolvedValue({ cost: 100, permissions: [] })
        preparePayment.mockReturnValue({})
        sendPayment.mockResolvedValue({
          payment_id: 'pay123',
          created_date: '2024-01-01T10:00:00Z',
          state: {},
          payment_provider: 'worldpay',
          _links: { next_url: { href: 'url' }, self: { href: 'self' } }
        })
        salesApi.getPaymentJournal.mockResolvedValue(false)

        await agreedHandler(request, h)

        expect(salesApi.createPaymentJournal).toHaveBeenCalledWith('test-id', {
          paymentReference: 'pay123',
          paymentTimestamp: '2024-01-01T10:00:00Z',
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
        })
      })

      it('updates payment journal when it already exists', async () => {
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

        expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('test-id', {
          paymentReference: 'pay456',
          paymentTimestamp: '2024-01-02T10:00:00Z',
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
        })
        expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()
      })
    })

    describe('return from payment - successful payment', () => {
      it('finalizes transaction and redirects to order complete', async () => {
        const mockStatusSet = jest.fn(async () => {})
        const request = getMockRequest({
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
        const h = getMockResponseToolkit()

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

        expect(mockStatusSet).toHaveBeenCalledWith(
          expect.objectContaining({
            [COMPLETION_STATUS.paymentCompleted]: true,
            [COMPLETION_STATUS.finalised]: true
          })
        )
        expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('test-id', {
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed
        })
        expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(ORDER_COMPLETE.uri)
      })
    })

    describe('return from payment - cancelled payment', () => {
      it('redirects to payment cancelled page', async () => {
        const mockStatusSet = jest.fn(async () => {})
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
                set: mockStatusSet
              }
            }
          })
        })
        const h = getMockResponseToolkit()

        getPaymentStatus.mockResolvedValue({
          state: {
            status: 'cancelled',
            finished: true,
            code: GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED
          }
        })

        await agreedHandler(request, h)

        expect(mockStatusSet).toHaveBeenCalledWith(
          expect.objectContaining({
            [COMPLETION_STATUS.paymentCancelled]: true
          })
        )
        expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('test-id', {
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Cancelled
        })
        expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_CANCELLED.uri)
      })
    })

    describe('return from payment - failed payment', () => {
      it.each([
        ['expired', GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED],
        ['rejected', GOVUK_PAY_ERROR_STATUS_CODES.REJECTED]
      ])('redirects to payment failed page when payment is %s', async (description, code) => {
        const mockStatusSet = jest.fn(async () => {})
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
                set: mockStatusSet
              }
            }
          })
        })
        const h = getMockResponseToolkit()

        getPaymentStatus.mockResolvedValue({
          state: { status: 'failed', finished: true, code }
        })

        await agreedHandler(request, h)

        expect(mockStatusSet).toHaveBeenCalledWith(
          expect.objectContaining({
            [COMPLETION_STATUS.paymentFailed]: true
          })
        )
        expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('test-id', {
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed
        })
        expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_FAILED.uri)
      })

      it('redirects to payment failed page when status is error', async () => {
        const mockStatusSet = jest.fn(async () => {})
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
                set: mockStatusSet
              }
            }
          })
        })
        const h = getMockResponseToolkit()

        getPaymentStatus.mockResolvedValue({
          state: { status: 'error', finished: true, code: 'P0050' }
        })

        await agreedHandler(request, h)

        expect(mockStatusSet).toHaveBeenCalledWith(
          expect.objectContaining({
            [COMPLETION_STATUS.paymentFailed]: true
          })
        )
        expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_FAILED.uri)
      })
    })
  })

  describe('recurring payment flow', () => {
    it('creates recurring payment agreement before posting to sales API', async () => {
      const mockStatusSet = jest.fn(async () => {})
      const mockTransactionSet = jest.fn(async () => {})
      const request = getMockRequest({
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
      const h = getMockResponseToolkit()

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

      expect(sendRecurringPayment).toHaveBeenCalled()
      expect(mockStatusSet).toHaveBeenCalledWith(
        expect.objectContaining({
          [COMPLETION_STATUS.recurringAgreement]: true
        })
      )
      expect(mockTransactionSet).toHaveBeenCalledWith(
        expect.objectContaining({
          agreementId: 'agr123'
        })
      )
      expect(sendPayment).toHaveBeenCalledWith(expect.anything(), true)
    })
  })

  describe('idempotency', () => {
    it('redirects to order complete when already finalised', async () => {
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
                [COMPLETION_STATUS.posted]: true,
                [COMPLETION_STATUS.finalised]: true
              })),
              set: jest.fn(async () => {})
            }
          }
        })
      })
      const h = getMockResponseToolkit()

      await agreedHandler(request, h)

      expect(salesApi.finaliseTransaction).not.toHaveBeenCalled()
      expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(ORDER_COMPLETE.uri)
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

      prepareApiTransactionPayload.mockResolvedValue({})
      salesApi.createTransaction.mockRejectedValue(new Error('API Error'))

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

      getPaymentStatus.mockResolvedValue({
        state: { status: 'started', finished: false }
      })

      await expect(agreedHandler(request, h)).rejects.toThrow(Boom.Forbidden)
    })
  })
})
