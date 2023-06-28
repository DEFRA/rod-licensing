import { LICENCE_DETAILS, ORDER_COMPLETE } from '../../../../uri.js'
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
  order_complete_panel_text_free_prefix: 'order_complete_panel_text_free_prefix',
  order_complete_panel_text_prefix: 'order_complete_panel_text_prefix',
  order_complete_panel_text_join: 'order_complete_panel_text_join',
  order_complete_panel_text_single_licence: 'order_complete_panel_text_single_licence',
  order_complete_panel_text_multiple_licences: 'order_complete_panel_text_multiple_licences',
  order_complete_view_details_postal: 'order_complete_view_details_postal',
  order_complete_view_details_digital: 'order_complete_view_details_digital',
  pound: '#',
  ...overrides
})

const getPostalPermission = () => ({
  licensee: {
    postalFulfilment: true,
    preferredMethodOfConfirmation: 'Prefer not to be contacted'
  }
})

const getDigitalPermission = () => ({
  licensee: {
    postalFulfilment: false
  }
})

jest.mock('@defra-fish/connectors-lib')

describe('The order completion handler', () => {
  beforeEach(jest.clearAllMocks)

  it.each([
    ['digital', [getDigitalPermission(), getDigitalPermission()]],
    ['digital and postal', [getDigitalPermission(), getPostalPermission()]]
  ])('When %s licences are purchased, viewDetailsParagraphs should have digital paragraph', async (_d, permissions) => {
    const viewDetailsDigital = Symbol('order_complete_view_details_digital')
    const request = getMockRequest({
      transaction: getMockTransaction({ permissions }),
      catalog: getMockCatalog({
        order_complete_view_details_digital: viewDetailsDigital
      })
    })
    const data = await getData(request)
    expect(data.viewDetailsParagraphs[0]).toBe(viewDetailsDigital)
  })

  it.each([
    ['postal', [getPostalPermission(), getPostalPermission()]],
    ['digital and postal', [getDigitalPermission(), getPostalPermission()]]
  ])('When %s licences are purchased, viewDetailsParagraphs should have postal paragraph', async (_d, permissions) => {
    const viewDetailsPostal = Symbol('order_complete_view_details_postal')
    const request = getMockRequest({
      transaction: getMockTransaction({ permissions }),
      catalog: getMockCatalog({
        order_complete_view_details_postal: viewDetailsPostal
      })
    })
    const data = await getData(request)
    expect(data.viewDetailsParagraphs[data.viewDetailsParagraphs.length - 1]).toBe(viewDetailsPostal)
  })

  it.each([
    ['digital', 'order_complete_when_fishing_digital', [getDigitalPermission(), getDigitalPermission()]],
    ['digital and postal', 'order_complete_when_fishing_mixed', [getDigitalPermission(), getPostalPermission()]]
  ])('When %s licences are purchased, whenFishingParagraph is set to %s', async (_d, label, permissions) => {
    const whenFishingLabel = Symbol(label)
    const request = getMockRequest({
      transaction: getMockTransaction({ permissions }),
      catalog: getMockCatalog({
        [label]: whenFishingLabel
      })
    })
    const data = await getData(request)
    expect(data.whenFishingParagraph).toBe(whenFishingLabel)
  })

  it('When postal licences are purchased, whenFishingParagraph is set to expected value', async () => {
    const orderCompleteWhenFishingPostal = 'when fishing postal text'
    const orderCompleteWhenFishingPostalLink = 'when fishing postal link'
    const request = getMockRequest({
      transaction: getMockTransaction({ permissions: [getPostalPermission(), getPostalPermission()] }),
      catalog: getMockCatalog({
        order_complete_when_fishing_postal: orderCompleteWhenFishingPostal,
        order_complete_when_fishing_postal_link: orderCompleteWhenFishingPostalLink
      })
    })
    const data = await getData(request)
    expect(data.whenFishingParagraph).toMatch(
      new RegExp(`${orderCompleteWhenFishingPostal}<a href="(.*)">${orderCompleteWhenFishingPostalLink}</a>`)
    )
  })

  it('When postal licences are purchased, whenFishingParagraph contains link to LICENCE_DETAILS', async () => {
    const request = getMockRequest({
      transaction: getMockTransaction({ permissions: [getPostalPermission(), getPostalPermission()] }),
      catalog: getMockCatalog({
        order_complete_when_fishing_postal: 'when fishing postal text',
        order_complete_when_fishing_postal_link: 'when fishing postal link'
      })
    })
    const data = await getData(request)
    expect(data.whenFishingParagraph).toMatch(new RegExp(`.*<a href="${LICENCE_DETAILS.uri}">(.*)</a>`))
  })

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

  it(`addLanguageCodeToUri is called with request and ${LICENCE_DETAILS.uri}`, async () => {
    const request = getMockRequest()
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, LICENCE_DETAILS.uri)
  })

  it('data outputs addLanguageCodeToUri decorated value for licence details uri', async () => {
    const decoratedUri = Symbol('licenceDetails')
    addLanguageCodeToUri.mockReturnValue(decoratedUri)
    const request = getMockRequest()

    const data = await getData(request)
    expect(data.uri.licenceDetails).toEqual(decoratedUri)
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

  it('sets byelaws, catch return and annual report urls', async () => {
    const {
      uri: { byelaws, salmonAndSeaTrout, annualReport }
    } = await getData(getMockRequest())
    expect({ byelaws, salmonAndSeaTrout, annualReport }).toMatchSnapshot()
  })

  it.each([
    ['no permits are for salmon fishing', false, ['Trout and coarse']],
    ['the most recently-added permit is for salmon fishing', true, ['Trout and coarse', 'Salmon and sea trout']],
    ['a previously-added permit is for salmon fishing', true, ['Salmon and sea trout', 'Trout and coarse']]
  ])('returns the correct displayCatchReturnInfo when %s', async (_desc, expected, licenceTypes) => {
    const permissions = []
    for (const licenceType of licenceTypes) {
      permissions.push({ ...getDigitalPermission(), licenceType })
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
    ['You\'ve shelled out <span class="govuk-!-font-weight-bold">#9.99</span> and that got you 2 angling permits', 9.99, 2],
    ['You\'ve shelled out <span class="govuk-!-font-weight-bold">#23.46</span> and that got you 5 angling permits', 23.46, 5],
    ['You\'ve shelled out <span class="govuk-!-font-weight-bold">#98.74</span> and that got you 9 angling permits', 98.74, 9],
    ['You\'ve shelled out <span class="govuk-!-font-weight-bold">#12.50</span> and that got you 2 angling permits', 12.5, 2],
    ['You\'ve shelled out <span class="govuk-!-font-weight-bold">#23.00</span> and that got you 5 angling permits', 23, 5],
    ['You\'ve shelled out <span class="govuk-!-font-weight-bold">#59.80</span> and that got you 1 angling permit', 59.8, 1],
    ["You've paid nowt for 3 angling permits", 0, 3],
    ["You've paid nowt for 1 angling permit", 0, 1]
  ])("sets licencePanelText to '%s' when price is %d and number of licences is %i", async (expectedText, cost, numberOfLicences) => {
    const request = getMockRequest({
      transaction: getMockTransaction({ permissions: Array(numberOfLicences).fill(getDigitalPermission()), cost }),
      catalog: getMockCatalog({
        order_complete_panel_text_free_prefix: "You've paid nowt for ",
        order_complete_panel_text_prefix: "You've shelled out ",
        order_complete_panel_text_join: ' and that got you ',
        order_complete_panel_text_single_licence: ' angling permit',
        order_complete_panel_text_multiple_licences: ' angling permits'
      })
    })
    const data = await getData(request)
    expect(data.licencePanelHTML).toBe(expectedText)
  })
})
