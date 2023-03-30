import { LICENCE_DETAILS, NEW_TRANSACTION, ORDER_COMPLETE } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../../constants.js'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'
import { LICENCE_TYPE } from '../../../../processors/mapping-constants.js'
import { displayPermissionPrice } from '../../../../processors/price-display.js'
import { getPermissionCost } from '@defra-fish/business-rules-lib'

jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../constants.js', () => ({
  ...jest.requireActual('../../../../constants.js'),
  COMPLETION_STATUS: {
    agreed: 'alright then',
    posted: 'in the letterbox',
    finalised: 'no going back now',
    completed: 'all done'
  },
  FEEDBACK_URI_DEFAULT: Symbol('http://pulling-no-punches.com')
}))
jest.mock('../../../../processors/price-display.js')
jest.mock('@defra-fish/business-rules-lib')

const getSamplePermission = ({ referenceNumber = 'AAA111', licenceType = LICENCE_TYPE['trout-and-coarse'] } = {}) => ({
  startDate: '2019-12-14T00:00:00Z',
  licensee: {
    postalFulfilment: 'test',
    preferredMethodOfConfirmation: 'test'
  },
  licenceType,
  referenceNumber
})

const getSampleRequest = ({
  agreed = true,
  posted = true,
  finalised = true,
  permission = getSamplePermission(),
  statusSet = () => {},
  transaction = () => ({
    permissions: [],
    cost: 0
  }),
  statusSetCurrentPermission = () => {},
  catalog = 'messages'
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        get: () => ({
          [COMPLETION_STATUS.agreed]: agreed,
          [COMPLETION_STATUS.posted]: posted,
          [COMPLETION_STATUS.finalised]: finalised
        }),
        setCurrentPermission: statusSetCurrentPermission,
        set: statusSet
      },
      transaction: {
        getCurrentPermission: () => permission,
        get: transaction
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
jest.mock('@defra-fish/connectors-lib')

describe('The order completion handler', () => {
  beforeAll(() => {
    displayPermissionPrice.mockReturnValue('1')
  })
  beforeEach(jest.clearAllMocks)

  it.each(['agreed', 'posted', 'finalised'])('throws Boom.forbidden error when %s is not set', async completion => {
    const request = getSampleRequest({ [completion]: false })
    const callGetData = () => getData(request)
    await expect(callGetData).rejects.toThrow(`Attempt to access the completion page handler with no ${completion} flag set`)
  })

  it('sets completion flag', async () => {
    const statusSet = jest.fn()
    await getData(getSampleRequest({ statusSet }))
    expect(statusSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [COMPLETION_STATUS.completed]: true
      })
    )
  })

  it('sets current page to order-complete in the cache', async () => {
    const statusSetCurrentPermission = jest.fn()
    await getData(getSampleRequest({ statusSetCurrentPermission }))
    expect(statusSetCurrentPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPage: ORDER_COMPLETE.page
      })
    )
  })

  it.each([[LICENCE_DETAILS.uri], [NEW_TRANSACTION.uri]])('addLanguageCodeToUri is called with request and %s', async uri => {
    const request = getSampleRequest()
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri)
  })

  it.each(['new', 'licenceDetails'])('data outputs addLanguageCodeToUri decorated value for %s uri', async uriName => {
    const decoratedUri = Symbol(uriName)
    addLanguageCodeToUri.mockReturnValue(decoratedUri)

    const { uri } = await getData(getSampleRequest())

    expect(uri[uriName]).toEqual(decoratedUri)
  })

  it.each(['http://trustpilot.com', 'http://give-us-a-stinker'])('feedback link set to FEEDBACK_URI env var (%s)', async feedbackUri => {
    process.env.FEEDBACK_URI = feedbackUri
    const {
      uri: { feedback }
    } = await getData(getSampleRequest())
    expect(feedback).toBe(feedbackUri)
  })

  it("uses FEEDBACK_URI_DEFAULT if FEEDBACK_URI env var isn't set", async () => {
    delete process.env.FEEDBACK_URI
    const {
      uri: { feedback }
    } = await getData(getSampleRequest())
    expect(feedback).toBe(FEEDBACK_URI_DEFAULT)
  })

  it('uses value returned by displayPermissionPrice for permissionCost', async () => {
    const expectedCost = Symbol('expected cost')
    displayPermissionPrice.mockReturnValueOnce(expectedCost)

    const { permissionCost } = await getData(getSampleRequest())

    expect(permissionCost).toBe(expectedCost)
  })

  it('uses value returned by displayPermissionPrice for permissionCost', async () => {
    const expectedCost = Symbol('expected cost')
    displayPermissionPrice.mockReturnValueOnce(expectedCost)

    const { permissionCost } = await getData(getSampleRequest())

    expect(permissionCost).toBe(expectedCost)
  })

  it('passes permission and label catalog to displayPermissionPrice function', async () => {
    const permission = getSamplePermission()
    const catalog = Symbol('catalog')

    await getData(getSampleRequest({ permission, catalog }))
    expect(displayPermissionPrice).toHaveBeenCalledWith(permission, catalog)
  })

  it('uses displayStartTime to generate startTimeStringTitle', async () => {
    const startTime = Symbol('one minute to midnight')
    displayStartTime.mockReturnValueOnce(startTime)
    const { startTimeStringTitle } = await getData(getSampleRequest())
    expect(startTimeStringTitle).toBe(startTime)
  })

  it('passes permission and label catalog to displayPermissionPrice function', async () => {
    const permission = getSamplePermission()
    const catalog = Symbol('catalog')

    await getData(getSampleRequest({ permission, catalog }))
    expect(displayPermissionPrice).toHaveBeenCalledWith(permission, catalog)
  })

  it('uses displayStartTime to generate startTimeStringTitle', async () => {
    const startTime = Symbol('one minute to midnight')
    displayStartTime.mockReturnValueOnce(startTime)
    const { startTimeStringTitle } = await getData(getSampleRequest())
    expect(startTimeStringTitle).toBe(startTime)
  })

  it.each([[LICENCE_DETAILS.uri], [NEW_TRANSACTION.uri]])('addLanguageCodeToUri is called with request and %s', async uri => {
    const transaction = () => ({
      permissions: [],
      cost: 0
    })

    const request = getSampleRequest({ transaction })

    displayStartTime.mockReturnValueOnce('1:00am on 6 June 2020')

    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, NEW_TRANSACTION.uri)
  })

  it('passes request and permission to displayStartTime', async () => {
    const permission = getSamplePermission(LICENCE_TYPE['salmon-and-sea-trout'])
    const request = getSampleRequest({ permission })
    await getData(request)
    expect(displayStartTime).toHaveBeenCalledWith(request, permission)
  })

  it.each`
    permission                                                                    | expectedValue
    ${getSamplePermission()}                                                      | ${false}
    ${getSamplePermission({ licenceType: LICENCE_TYPE['salmon-and-sea-trout'] })} | ${true}
  `('identifies salmon licence of type $permission.licenceType', async ({ permission, expectedValue }) => {
    const request = getSampleRequest({ permission })
    const { isSalmonLicence } = await getData(request)
    expect(isSalmonLicence).toBe(expectedValue)
  })

  it('addLanguageCodeToUri outputs correct value', async () => {
    const transaction = () => ({
      permissions: [],
      cost: 0
    })

    const decoratedUri = Symbol('order complete uri')
    addLanguageCodeToUri.mockReturnValue(decoratedUri)

    displayStartTime.mockReturnValueOnce('1:00am on 6 June 2020')
    const request = getSampleRequest({ transaction })

    const data = await getData(request)
    expect(data.uri.new).toEqual(decoratedUri)
  })

  it.each([
    [1, ['foo']],
    [2, ['foo', 'bar']]
  ])('checks the numberOfLicences correctly when the number of licences is %s', async (count, permissions) => {
    const transaction = () => ({
      permissions: permissions,
      cost: 0
    })
    const request = getSampleRequest({ transaction })
    const data = await getData(request)
    expect(data.numberOfLicences).toEqual(count)
  })

  it('returns the correct totalCost', async () => {
    const transaction = () => ({
      permissions: [],
      cost: 100
    })
    const request = getSampleRequest({ transaction })
    const data = await getData(request)

    expect(data.totalCost).toEqual(100)
  })

  it.each([
    [0, true],
    [10, false]
  ])('passes permission reference %s', async (cost, isFree) => {
    const permission = getSamplePermission()
    getPermissionCost.mockReturnValueOnce(cost)
    const { permissionIsFree } = await getData(getSampleRequest(permission))
    expect(permissionIsFree).toBe(isFree)
  })
})
