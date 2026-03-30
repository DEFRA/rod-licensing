import agreedHandler from '../agreed-handler.js'
import { CONTROLLER } from '../../uri.js'

jest.mock('@defra-fish/connectors-lib')
jest.mock('debug', () => jest.fn(() => jest.fn()))

const getResponseToolkit = () => ({
  redirectWithLanguageCode: jest.fn()
})

const getMockRequest = ({ transaction, status } = {}) => ({
  cache: () => ({
    helpers: {
      transaction: {
        get: async () => transaction
      },
      status: {
        get: async () => status
      }
    }
  })
})

describe('agreed handler - missing session data', () => {
  it('redirects to the controller when transaction is null', async () => {
    const h = getResponseToolkit()
    await agreedHandler(getMockRequest({ transaction: null, status: {} }), h)
    expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CONTROLLER.uri)
  })

  it('redirects to the controller when status is null', async () => {
    const h = getResponseToolkit()
    await agreedHandler(getMockRequest({ transaction: {}, status: null }), h)
    expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CONTROLLER.uri)
  })

  it('redirects to the controller when both transaction and status are null', async () => {
    const h = getResponseToolkit()
    await agreedHandler(getMockRequest({ transaction: null, status: null }), h)
    expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CONTROLLER.uri)
  })
})
