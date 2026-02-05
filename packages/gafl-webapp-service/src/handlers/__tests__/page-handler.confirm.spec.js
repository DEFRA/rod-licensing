// Use the real registry and mock only the page-level update function
const mockedUpdate = jest.fn(async () => {})
jest.mock('../../pages/recurring-payments/cancel/confirm/update-transaction.js', () => ({
  __esModule: true,
  default: mockedUpdate
}))

const getMockRequest = () => {
  const statusBox = { value: {} }
  const getStatus = jest.fn(() => statusBox.value)
  const setStatus = jest.fn(s => {
    statusBox.value = s
  })

  return {
    cache: () => ({
      helpers: {
        page: {
          setCurrentPermission: jest.fn()
        },
        status: {
          getCurrentPermission: getStatus,
          setCurrentPermission: setStatus
        },
        transaction: {
          getCurrentPermission: jest.fn(async () => ({}))
        }
      }
    })
  }
}

const getMockToolkit = () => ({
  redirectWithLanguageCode: jest.fn(() => ({ takeover: () => {} }))
})

describe('confirm route integration (handler)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('invokes update function on POST for CANCEL_RP_CONFIRM', async () => {
    const { CANCEL_RP_CONFIRM } = require('../../uri.js')

    const { nextPage } = require('../../routes/next-page.js')
    const handler = require('../page-handler.js').default(CANCEL_RP_CONFIRM.uri, CANCEL_RP_CONFIRM.page, nextPage)

    const request = getMockRequest()
    const toolkit = getMockToolkit()

    await handler.post(request, toolkit)

    const pageUpdate = require('../../pages/recurring-payments/cancel/confirm/update-transaction.js').default
    expect(pageUpdate).toHaveBeenCalledTimes(1)
  })

  it('redirects to CANCEL_RP_COMPLETE on POST', async () => {
    const { CANCEL_RP_CONFIRM, CANCEL_RP_COMPLETE } = require('../../uri.js')

    const { nextPage } = require('../../routes/next-page.js')
    const handler = require('../page-handler.js').default(CANCEL_RP_CONFIRM.uri, CANCEL_RP_CONFIRM.page, nextPage)

    const request = getMockRequest()
    const toolkit = getMockToolkit()

    await handler.post(request, toolkit)

    expect(toolkit.redirectWithLanguageCode).toHaveBeenCalledWith(CANCEL_RP_COMPLETE.uri)
  })
})
