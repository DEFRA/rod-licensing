import { CANCEL_RP_CONFIRM, CANCEL_RP_COMPLETE } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'
import pageHandler from '../page-handler.js'
import pageUpdate from '../../pages/recurring-payments/cancel/confirm/update-transaction.js'

jest.mock('../../pages/recurring-payments/cancel/confirm/update-transaction.js', () => ({
  __esModule: true,
  default: jest.fn(async () => {})
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
  })

  it('invokes update function on POST for CANCEL_RP_CONFIRM', async () => {
    const handler = pageHandler(CANCEL_RP_CONFIRM.uri, CANCEL_RP_CONFIRM.page, nextPage)

    const request = getMockRequest()
    const toolkit = getMockToolkit()

    await handler.post(request, toolkit)

    expect(pageUpdate).toHaveBeenCalledTimes(1)
  })

  it('redirects to CANCEL_RP_COMPLETE on POST', async () => {
    const handler = pageHandler(CANCEL_RP_CONFIRM.uri, CANCEL_RP_CONFIRM.page, nextPage)

    const request = getMockRequest()
    const toolkit = getMockToolkit()

    await handler.post(request, toolkit)

    expect(toolkit.redirectWithLanguageCode).toHaveBeenCalledWith(CANCEL_RP_COMPLETE.uri)
  })
})
