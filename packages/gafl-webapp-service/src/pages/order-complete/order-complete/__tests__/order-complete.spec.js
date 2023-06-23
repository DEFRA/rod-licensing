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
  order_complete_panel_text_free_prefix: 'order_complete_panel_text_free_prefix',
  order_complete_panel_text_prefix: 'order_complete_panel_text_prefix',
  order_complete_panel_text_join: 'order_complete_panel_text_join',
  order_complete_panel_text_single_licence: 'order_complete_panel_text_single_licence',
  order_complete_panel_text_multiple_licences: 'order_complete_panel_text_multiple_licences',
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
    ["You've shelled out £9.99 and that got you 2 angling permits", 9.99, 2],
    ["You've shelled out £23.46 and that got you 5 angling permits", 23.46, 5],
    ["You've shelled out £98.74 and that got you 9 angling permits", 98.74, 9],
    ["You've shelled out £12.50 and that got you 2 angling permits", 12.5, 2],
    ["You've shelled out £23.00 and that got you 5 angling permits", 23, 5],
    ["You've shelled out £59.80 and that got you 1 angling permit", 59.8, 1],
    ["You've paid nowt for 3 angling permits", 0, 3],
    ["You've paid nowt for 1 angling permit", 0, 1]
  ])("sets licencePanelText to '%s' when price is %d and number of licences is %i", async (expectedText, cost, numberOfLicences) => {
    const request = getMockRequest({
      transaction: getMockTransaction({ permissions: Array(numberOfLicences).fill({}), cost }),
      catalog: getMockCatalog({
        order_complete_panel_text_free_prefix: "You've paid nowt for ",
        order_complete_panel_text_prefix: "You've shelled out £",
        order_complete_panel_text_join: ' and that got you ',
        order_complete_panel_text_single_licence: ' angling permit',
        order_complete_panel_text_multiple_licences: ' angling permits'
      })
    })
    const data = await getData(request)
    expect(data.licencePanelText).toBe(expectedText)
  })
})
