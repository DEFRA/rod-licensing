import handler from '../cancel-recurring-payment-agreed-handler'
import { CANCEL_RP_COMPLETE } from '../../uri.js'
import { salesApi } from '@defra-fish/connectors-lib'
import db from 'debug'

jest.mock('@defra-fish/connectors-lib')
jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:cancel-rp-agreed')]

const getSampleRequest = ({ id = 'foo' } = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: async () => ({
          recurringPayment: {
            id
          }
        })
      }
    }
  })
})

const getSampleResponseToolkit = () => ({
  redirectWithLanguageCode: jest.fn()
})

describe('cancel recurring payment agreed handler', () => {
  it('calls the Sales API with the recurringPayment ID', async () => {
    const id = Symbol('id')
    const request = getSampleRequest({ id })
    await handler(request, getSampleResponseToolkit())

    expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith(id, 'User Cancelled')
  })

  it('redirects to the complete page', async () => {
    const toolkit = getSampleResponseToolkit()
    await handler(getSampleRequest(), toolkit)

    expect(toolkit.redirectWithLanguageCode).toHaveBeenCalledWith(CANCEL_RP_COMPLETE.uri)
  })

  describe('when the Sales API throws an error', () => {
    it('logs the error', async () => {
      const error = new Error('Boo, hiss!')
      salesApi.cancelRecurringPayment.mockRejectedValueOnce(error)

      const id = Symbol('id')
      const request = getSampleRequest({ id })

      try {
        await handler(request, getSampleResponseToolkit())
      } catch (e) {}

      expect(debug).toHaveBeenCalledWith('Error sending cancellation to Sales API', id)
    })

    it('throws the error', async () => {
      const error = new Error('Boo, hiss!')
      salesApi.cancelRecurringPayment.mockRejectedValueOnce(error)

      await expect(handler(getSampleRequest(), getSampleResponseToolkit())).rejects.toThrow(error)
    })
  })
})
