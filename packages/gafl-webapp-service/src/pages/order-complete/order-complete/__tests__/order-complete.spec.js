import { ORDER_COMPLETE, LICENCE_DETAILS, NEW_TRANSACTION } from '../../../../uri.js'
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
  FEEDBACK_URI_DEFAULT: Symbol('http://pulling-no-punches.com'),
  HOW_CONTACTED: {
    none: 'nada',
    email: 'e-mail',
    text: 'phone',
    letter: 'letter'
  }
}))
jest.mock('../../../../processors/price-display.js')
jest.mock('@defra-fish/business-rules-lib')

const getSamplePermission = ({
  referenceNumber = 'AAA111',
  licenceType = LICENCE_TYPE['trout-and-coarse'],
  isLicenceForYou = true,
  postalFulfilment = false,
  preferredMethodOfConfirmation = 'phone'
} = {}) => ({
  startDate: '2019-12-14T00:00:00Z',
  licensee: {
    postalFulfilment,
    preferredMethodOfConfirmation
  },
  isLicenceForYou,
  licenceType,
  referenceNumber
})

const getSampleCompletionStatus = ({ agreed = true, posted = true, finalised = true } = {}) => ({
  [COMPLETION_STATUS.agreed]: agreed,
  [COMPLETION_STATUS.posted]: posted,
  [COMPLETION_STATUS.finalised]: finalised
})

const getMessages = () => ({
  order_complete_title_application: 'application title',
  order_complete_title_payment: 'payment title ',
  order_complete_licence_details_self_title: 'title self licence details',
  order_complete_licence_details_bobo_title: 'title bobo licence details',
  order_complete_licence_details_self_paragraph: 'paragraph self licence details',
  order_complete_licence_details_bobo_paragraph: 'paragraph bobo licence details',
  order_complete_licence_details_self_digital_confirmation_paragraph: 'fishing self digital confirmation licence details',
  order_complete_licence_details_bobo_digital_confirmation_paragraph: 'fishing bobo digital confirmation licence details',
  order_complete_licence_details_self_digital_paragraph: 'fishing self digital licence details',
  order_complete_licence_details_bobo_digital_paragraph: 'fishing bobo digital licence details',
  order_complete_when_fishing_self_link: 'fishing self link',
  order_complete_when_fishing_bobo_link: 'fishing bobo link',
  order_complete_when_fishing_self_paragraph_2: 'fishing self paragraph two when fishing',
  order_complete_when_fishing_bobo_paragraph_2: 'fishing bobo paragraph two when fishing',
  order_complete_when_fishing_self_paragraph: 'fishing self paragraph one when fishing',
  order_complete_when_fishing_bobo_paragraph: 'fishing bobo paragraph one when fishing',
  order_complete_when_fishing_self_digital_confirmation_paragraph: 'fishing self digital confirmation when fishing',
  order_complete_when_fishing_bobo_digital_confirmation_paragraph: 'fishing bobo digital confirmation when fishing',
  order_complete_when_fishing_self_digital_paragraph: 'fishing self digital when fishing',
  order_complete_when_fishing_bobo_digital_paragraph: 'fishing bobo digital when fishing'
})

const getSampleRequest = ({
  completionStatus = getSampleCompletionStatus(),
  permission = getSamplePermission(),
  statusSet = () => {},
  statusSetCurrentPermission = () => {},
  payment = { created_date: undefined }
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        get: () => completionStatus,
        setCurrentPermission: statusSetCurrentPermission,
        set: statusSet
      },
      transaction: {
        get: async () => ({
          payment
        }),
        getCurrentPermission: () => permission
      }
    }
  }),
  url: {
    search: ''
  },
  i18n: {
    getCatalog: () => getMessages()
  }
})
jest.mock('@defra-fish/connectors-lib')

const postalYouNoneDigitalConf = {
  title: 'payment title 1',
  licenceTitle: 'title self licence details',
  licenceDetailsDigitalParagraph: undefined,
  licenceDetailsParagraphTwo: 'paragraph self licence details',
  whenFishingParagraphOne: 'fishing self paragraph one when fishing',
  whenFishingParagraphOneLink: 'fishing self link',
  whenFishingParagraphTwo: 'fishing self paragraph two when fishing'
}

const postalElseNoneDigitalConf = {
  title: 'payment title 1',
  licenceTitle: 'title bobo licence details',
  licenceDetailsDigitalParagraph: undefined,
  licenceDetailsParagraphTwo: 'paragraph bobo licence details',
  whenFishingParagraphOne: 'fishing bobo paragraph one when fishing',
  whenFishingParagraphOneLink: 'fishing bobo link',
  whenFishingParagraphTwo: 'fishing bobo paragraph two when fishing'
}

const postalYouDigitalConf = {
  title: 'payment title 1',
  licenceTitle: 'title self licence details',
  licenceDetailsDigitalParagraph: 'fishing self digital confirmation licence details',
  licenceDetailsParagraphTwo: 'paragraph self licence details',
  whenFishingParagraphOne: 'fishing self digital confirmation when fishing',
  whenFishingParagraphOneLink: 'fishing self link',
  whenFishingParagraphTwo: 'fishing self paragraph two when fishing'
}

const postalElseDigitalConf = {
  title: 'payment title 1',
  licenceTitle: 'title bobo licence details',
  licenceDetailsDigitalParagraph: 'fishing bobo digital confirmation licence details',
  licenceDetailsParagraphTwo: 'paragraph bobo licence details',
  whenFishingParagraphOne: 'fishing bobo digital confirmation when fishing',
  whenFishingParagraphOneLink: 'fishing bobo link',
  whenFishingParagraphTwo: 'fishing bobo paragraph two when fishing'
}

const youDigital = {
  title: 'payment title 1',
  licenceTitle: 'title self licence details',
  licenceDetailsDigitalParagraph: 'fishing self digital licence details',
  licenceDetailsParagraphTwo: 'paragraph self licence details',
  whenFishingParagraphOne: 'fishing self digital when fishing',
  whenFishingParagraphOneLink: 'fishing self link',
  whenFishingParagraphTwo: 'fishing self paragraph two when fishing'
}

const elseDigital = {
  title: 'payment title 1',
  licenceTitle: 'title bobo licence details',
  licenceDetailsDigitalParagraph: 'fishing bobo digital licence details',
  licenceDetailsParagraphTwo: 'paragraph bobo licence details',
  whenFishingParagraphOne: 'fishing bobo digital when fishing',
  whenFishingParagraphOneLink: 'fishing bobo link',
  whenFishingParagraphTwo: 'fishing bobo paragraph two when fishing'
}

describe('The order completion handler', () => {
  beforeAll(() => {
    displayPermissionPrice.mockReturnValue('1')
  })
  beforeEach(jest.clearAllMocks)

  it.each(['agreed', 'posted', 'finalised'])('throws Boom.forbidden error when %s is not set', async completion => {
    const completionStatus = getSampleCompletionStatus({ [completion]: false })
    const request = getSampleRequest({ completionStatus })
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

  it.each`
    desc                                                                | licenceFor | postal   | method      | expected
    ${'Postal licence for you with none digital confirmation'}          | ${true}    | ${true}  | ${'Letter'} | ${postalYouNoneDigitalConf}
    ${'Postal licence for someone else with none digital confirmation'} | ${false}   | ${true}  | ${'Letter'} | ${postalElseNoneDigitalConf}
    ${'Postal licence for you with digital confirmation'}               | ${true}    | ${true}  | ${'Text'}   | ${postalYouDigitalConf}
    ${'Postal licence for someone else with digital confirmation'}      | ${false}   | ${true}  | ${'Text'}   | ${postalElseDigitalConf}
    ${'Digital licence for you'}                                        | ${true}    | ${false} | ${'Text'}   | ${youDigital}
    ${'Digital licence for someone else'}                               | ${false}   | ${false} | ${'Text'}   | ${elseDigital}
  `('$desc', async ({ desc, licenceFor, postal, method, expected }) => {
    const permission = getSamplePermission({ isLicenceForYou: licenceFor, postalFulfilment: postal, preferredMethodOfConfirmation: method })
    const { content } = await getData(getSampleRequest({ permission }))
    expect(content).toEqual(expected)
  })

  it('passes request and permission to displayStartTime', async () => {
    const permission = getSamplePermission(LICENCE_TYPE['salmon-and-sea-trout'])
    const request = getSampleRequest({ permission })
    await getData(request)
    expect(displayStartTime).toHaveBeenCalledWith(request, permission)
  })

  it('uses displayStartTime to generate startTimeStringTitle', async () => {
    const startTime = Symbol('one minute to midnight')
    displayStartTime.mockReturnValueOnce(startTime)
    const { startTimeStringTitle } = await getData(getSampleRequest())
    expect(startTimeStringTitle).toBe(startTime)
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
    const { permissionReference } = await getData(getSampleRequest({ permission }))
    expect(permissionReference).toBe(referenceNumber)
  })

  it.each`
    method      | postal   | expected
    ${'Email'}  | ${false} | ${false}
    ${'Text'}   | ${false} | ${false}
    ${'Letter'} | ${false} | ${false}
    ${'None'}   | ${false} | ${false}
    ${'Email'}  | ${true}  | ${true}
    ${'Text'}   | ${true}  | ${true}
  `(
    'when preferredMethodOfConfirmation is $method, postalFulfilment is $postal, digitalLicence equals $expected ',
    async ({ method, postal, expected }) => {
      const permission = getSamplePermission({ postalFulfilment: postal, preferredMethodOfConfirmation: method })
      const { digitalConfirmation } = await getData(getSampleRequest({ permission }))
      expect(digitalConfirmation).toBe(expected)
    }
  )

  it.each`
    method      | postal   | expected
    ${'Email'}  | ${false} | ${true}
    ${'Text'}   | ${false} | ${true}
    ${'Letter'} | ${false} | ${false}
    ${'None'}   | ${false} | ${false}
    ${'Email'}  | ${true}  | ${false}
    ${'Text'}   | ${true}  | ${false}
  `(
    'when preferredMethodOfConfirmation is $method, postalFulfilment is $postal, digitalLicence equals $expected ',
    async ({ method, postal, expected }) => {
      const permission = getSamplePermission({ postalFulfilment: postal, preferredMethodOfConfirmation: method })
      const { digitalLicence } = await getData(getSampleRequest({ permission }))
      expect(digitalLicence).toBe(expected)
    }
  )

  it.each([true, false])('postalLicence equals %s when same value as postalFulfilment', async postal => {
    const permission = getSamplePermission({ postalFulfilment: postal })
    const { postalLicence } = await getData(getSampleRequest({ permission }))
    expect(postalLicence).toBe(postal)
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

  it.each`
    desc                                            | payment
    ${'permission, created_date and label catalog'} | ${{ created_date: Symbol('created date') }}
    ${'permission and label catalog'}               | ${undefined}
  `('passes $desc to displayPermissionPrice function', async ({ desc, payment }) => {
    const permission = getSamplePermission()
    const catalog = getMessages()
    const result = payment?.created_date
    await getData(getSampleRequest({ permission, payment }))
    expect(displayPermissionPrice).toHaveBeenCalledWith(permission, catalog, result)
  })

  it.each`
    desc                             | payment
    ${'permission and created_date'} | ${{ created_date: Symbol('created date') }}
    ${'permission'}                  | ${undefined}
  `('passes $desc to getPermissionCost function', async ({ desc, payment }) => {
    const permission = getSamplePermission()
    const result = payment?.created_date
    await getData(getSampleRequest({ permission, payment }))
    expect(getPermissionCost).toHaveBeenCalledWith(permission, result)
  })
})
