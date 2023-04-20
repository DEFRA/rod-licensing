import { LICENCE_DETAILS, NEW_TRANSACTION, ORDER_COMPLETE } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../../constants.js'

jest.mock('../../../../processors/uri-helper.js')

const getMockRequest = ({
  statusGetOverrides = {},
  statusSetCurrentPermission = () => {},
  statusSet = () => {},
  transaction = getMockTransaction()
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        get: async () => ({
          [COMPLETION_STATUS.agreed]: true,
          [COMPLETION_STATUS.posted]: true,
          [COMPLETION_STATUS.finalised]: true,
          ...statusGetOverrides
        }),
        setCurrentPermission: statusSetCurrentPermission,
        set: statusSet
      },
      transaction: {
        get: async () => transaction
      }
    }
  }),
  url: {
    search: ''
  },
  i18n: {
    getCatalog: () => 'messages'
  }
})

const getMockTransaction = (permissions = [], cost = 0) => ({
  permissions,
  cost
})

jest.mock('@defra-fish/connectors-lib')

describe('The order completion handler', () => {
  beforeEach(jest.clearAllMocks)

  it.each([COMPLETION_STATUS.agreed, COMPLETION_STATUS.posted, COMPLETION_STATUS.finalised])(
    'throws Boom.forbidden error when %s is not set',
    async completion => {
      const statusGetOverrides = { [completion]: false }
      const request = getMockRequest({ statusGetOverrides })

      await expect(() => getData(request)).rejects.toThrow(`Attempt to access the completion page handler with no ${completion} flag set`)
    }
  )

  it('sets completion flag', async () => {
    const statusSet = jest.fn()
    const request = getMockRequest({ statusSet })

    await getData(request)
    expect(statusSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [COMPLETION_STATUS.completed]: true
      })
    )
  })

  it('sets current page to order-complete in the cache', async () => {
    const statusSetCurrentPermission = jest.fn()
    const request = getMockRequest({ statusSetCurrentPermission })

    await getData(request)
    expect(statusSetCurrentPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: ORDER_COMPLETE.page
      })
    )
  })

  it.each([[LICENCE_DETAILS.uri], [NEW_TRANSACTION.uri]])('addLanguageCodeToUri is called with request and %s', async uri => {
    const request = getMockRequest()

    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri)
  })

  it.each(['new', 'licenceDetails'])('data outputs addLanguageCodeToUri decorated value for %s uri', async uriName => {
    const decoratedUri = Symbol(uriName)
    addLanguageCodeToUri.mockReturnValue(decoratedUri)
    const request = getMockRequest()

    const data = await getData(request)
    expect(data.uri[uriName]).toEqual(decoratedUri)
  })

  it.each(['http://trustpilot.com', 'http://give-us-a-stinker'])('feedback link set to FEEDBACK_URI env var (%s)', async feedbackUri => {
    process.env.FEEDBACK_URI = feedbackUri
    const request = getMockRequest()

    const data = await getData(request)
    expect(data.uri.feedback).toBe(feedbackUri)
  })

  it("uses FEEDBACK_URI_DEFAULT if FEEDBACK_URI env var isn't set", async () => {
    delete process.env.FEEDBACK_URI
    const request = getMockRequest()

    const data = await getData(request)
    expect(data.uri.feedback).toBe(FEEDBACK_URI_DEFAULT)
  })

  it.each([
    [1, ['foo']],
    [2, ['foo', 'bar']]
  ])('checks the numberOfLicences correctly when the number of licences is %s', async (count, permissions) => {
    const transaction = getMockTransaction(permissions)
    const request = getMockRequest({ transaction })

    const data = await getData(request)
    expect(data.numberOfLicences).toEqual(count)
  })

  it('returns the correct totalCost', async () => {
    const transaction = getMockTransaction([], 100)
    const request = getMockRequest({ transaction })

    const data = await getData(request)
    expect(data.totalCost).toEqual(100)
  })

  it.each([
    ['no permits are for salmon fishing', false, ['Trout and coarse']],
    ['the most recently-added permit is for salmon fishing', true, ['Trout and coarse', 'Salmon and sea trout']],
    ['a previously-added permit is for salmon fishing', true, ['Salmon and sea trout', 'Trout and coarse']]
  ])('returns the correct displayCatchReturnInfo when %s', async (_desc, expected, licenceTypes) => {
    const permissions = []
    for (const licenceType of licenceTypes) {
      permissions.push({ licenceType })
    }
    const transaction = getMockTransaction(permissions)
    const request = getMockRequest({ transaction })

    const data = await getData(request)
    expect(data.displayCatchReturnInfo).toEqual(expected)
  })
})
