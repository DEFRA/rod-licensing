import { LICENCE_DETAILS, NEW_TRANSACTION, ORDER_COMPLETE } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../../constants.js'

jest.mock('../../../../processors/uri-helper.js')

const getMockRequest = ({
  statusGetOverrides = {},
  statusSetCurrentPermission = () => {},
  statusSet = () => {},
  transaction = getMockTransaction(),
  catalog = getMockCatalog()
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
    getCatalog: () => catalog
  }
})

const getMockTransaction = ({ permissions = [], cost = 0 } = {}) => ({
  permissions,
  cost
})

const getMockCatalog = (overrides = {}) => ({
  order_complete_title_application: 'order_complete_title_application',
  order_complete_title_payment: 'order_complete_title_payment',
  pound: '£',
  ...overrides
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
    ['no permits are for salmon fishing', false, ['Trout and coarse']],
    ['the most recently-added permit is for salmon fishing', true, ['Trout and coarse', 'Salmon and sea trout']],
    ['a previously-added permit is for salmon fishing', true, ['Salmon and sea trout', 'Trout and coarse']]
  ])('returns the correct displayCatchReturnInfo when %s', async (_desc, expected, licenceTypes) => {
    const permissions = []
    for (const licenceType of licenceTypes) {
      permissions.push({ licenceType })
    }
    const transaction = getMockTransaction({ permissions })
    const request = getMockRequest({ transaction })

    const data = await getData(request)
    expect(data.displayCatchReturnInfo).toEqual(expected)
  })

  it.each([
    ['order_complete_title_application', 0, 'zero cost title'],
    ['order_complete_title_payment', 9.99, 'paid for title']
  ])('sets page title to %s if cost is %d', async (titleKey, cost, expectedTitle) => {
    const request = getMockRequest({
      transaction: getMockTransaction({ cost }),
      catalog: getMockCatalog({
        [titleKey]: expectedTitle
      })
    })
    const data = await getData(request)
    expect(data.title).toBe(expectedTitle)
  })

  it.each([
    ['zero cost title', 0, 'order_complete_title_application', 'zero cost title'],
    ['£9.99<br />paid for title', 9.99, 'order_complete_title_payment', 'paid for title']
  ])('sets page html to %s when cost is %d', async (expectedHTML, cost, titleKey, titleVal) => {
    const request = getMockRequest({
      transaction: getMockTransaction({ cost }),
      catalog: getMockCatalog({
        [titleKey]: titleVal
      })
    })
    const data = await getData(request)
    expect(data.titleHTML).toBe(expectedHTML)
  })

  it.each([
    ['1 licence', 1, 'order_complete_licence_count_single', ' licence'],
    ['3 licences', 3, 'order_complete_licence_count_multiple', ' licences']
  ])('sets licencePanelText to %s when number of licences is %i', async (expectedText, numberOfLicences, msgKey, msgVal) => {
    const request = getMockRequest({
      transaction: getMockTransaction({ permissions: Array(numberOfLicences).fill({}) }),
      catalog: getMockCatalog({
        [msgKey]: msgVal
      })
    })
    const data = await getData(request)
    expect(data.licencePanelText).toBe(expectedText)
  })
})
