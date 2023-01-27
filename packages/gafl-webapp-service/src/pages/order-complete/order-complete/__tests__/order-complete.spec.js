import { ORDER_COMPLETE, LICENCE_DETAILS, NEW_TRANSACTION } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../../constants.js'
import { getPermissionCost } from '@defra-fish/business-rules-lib'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'
import { LICENCE_TYPE } from '../../../../processors/mapping-constants.js'

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
  statusSetCurrentPermission = () => {}
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
        getCurrentPermission: () => permission
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
jest.mock('@defra-fish/connectors-lib')

describe('The order completion handler', () => {
  beforeAll(() => {
    getPermissionCost.mockReturnValue(1)
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

  it.each([
    [29, '29'],
    [37, '37'],
    [48.5, '48.50'],
    [99.99, '99.99']
  ])('uses business rules to calculate permission cost (returns %d, displays £%s)', async (calculatedCost, displayCost) => {
    getPermissionCost.mockReturnValueOnce(calculatedCost)

    const { permissionCost } = await getData(getSampleRequest())

    expect(permissionCost).toBe(displayCost)
  })

  it('passes start date and permit to getPermissionCost function', async () => {
    const permission = getSamplePermission()
    permission.startDate = Symbol('start date')
    permission.permit = Symbol('permit')
    await getData(getSampleRequest({ permission }))
    expect(getPermissionCost).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: permission.startDate,
        permit: permission.permit
      })
    )
  })

  it('uses displayStartTime to generate startTimeStringTitle', async () => {
    const startTime = Symbol('one minute to midnight')
    displayStartTime.mockReturnValueOnce(startTime)
    const { startTimeStringTitle } = await getData(getSampleRequest())
    expect(startTimeStringTitle).toBe(startTime)
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

  it.each(['ABC123', 'ZXY099'])('passes permission reference %s', async referenceNumber => {
    const permission = getSamplePermission({ referenceNumber })
    const { permissionReference } = await getData(getSampleRequest(permission))
    expect(permissionReference).toBe(permissionReference)
  })
})
