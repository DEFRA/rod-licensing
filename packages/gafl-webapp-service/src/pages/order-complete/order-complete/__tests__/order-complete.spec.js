import { ORDER_COMPLETE, LICENCE_DETAILS, NEW_TRANSACTION } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../../constants.js'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'
import { LICENCE_TYPE } from '../../../../processors/mapping-constants.js'
import { displayPrice } from '../../../../processors/price-display.js'
import { validForRecurringPayment } from '../../../../processors/recurring-pay-helper.js'

jest.mock('../../../../processors/recurring-pay-helper.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../processors/mapping-constants.js', () => ({
  HOW_CONTACTED: {
    none: 'nada',
    email: 'e-mail',
    text: 'phone',
    letter: 'letter'
  },
  LICENCE_TYPE: {
    'trout-and-coarse': 'Trout and coarse',
    'salmon-and-sea-trout': 'Salmon and sea trout'
  }
}))
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

const getSampleLicensee = ({
  postalFulfilment = false,
  preferredMethodOfConfirmation = 'phone',
  preferredMethodOfReminder = 'phone'
} = {}) => ({
  postalFulfilment,
  preferredMethodOfConfirmation,
  preferredMethodOfReminder
})

const getSamplePermission = ({
  referenceNumber = 'AAA111',
  licenceType = LICENCE_TYPE['trout-and-coarse'],
  isLicenceForYou = true,
  licenceLength = '12M',
  licensee = getSampleLicensee()
} = {}) => ({
  startDate: '2019-12-14T00:00:00Z',
  licensee,
  isLicenceForYou,
  licenceType,
  referenceNumber,
  licenceLength
})

const getSampleCompletionStatus = ({ agreed = true, posted = true, finalised = true, setUpPayment = true } = {}) => ({
  [COMPLETION_STATUS.agreed]: agreed,
  [COMPLETION_STATUS.posted]: posted,
  [COMPLETION_STATUS.finalised]: finalised,
  permissions: [
    {
      'set-up-payment': setUpPayment
    }
  ]
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
  order_complete_when_fishing_self_postal_non_digital_2: 'fishing self non postal non digital when fishing two',
  order_complete_when_fishing_bobo_postal_non_digital_2: 'fishing bobo non postal non digital when fishing two',
  order_complete_when_fishing_self_postal_non_digital: 'fishing self non postal non digital when fishing',
  order_complete_when_fishing_bobo_postal_non_digital: 'fishing bobo non postal non digital when fishing',
  order_complete_when_fishing_self_postal_digital: 'fishing self postal digital when fishing',
  order_complete_when_fishing_bobo_postal_digital: 'fishing bobo postal digital when fishing',
  order_complete_when_fishing_self_non_postal_digital: 'fishing self non postal digital when fishing',
  order_complete_when_fishing_bobo_non_postal_digital: 'fishing bobo non postal digital when fishing',
  order_complete_future_payments_digital_paragraph_1: 'future payments digital one',
  order_complete_future_payments_digital_paragraph_2: 'future payments digital two',
  order_complete_future_payments_postal_paragraph_1: 'future payments postal one',
  order_complete_future_payments_postal_paragraph_2: 'future payments postal two'
})

const getSampleRequest = ({
  completionStatus = getSampleCompletionStatus(),
  permission = getSamplePermission(),
  statusSet = () => {},
  statusSetCurrentPermission = () => {},
  transactionCost = 1,
  messages = getMessages()
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
          cost: transactionCost
        }),
        getCurrentPermission: () => permission
      }
    }
  }),
  url: {
    search: ''
  },
  i18n: {
    getCatalog: () => messages
  }
})
jest.mock('@defra-fish/connectors-lib')

describe('The order completion handler', () => {
  beforeAll(() => {
    displayPrice.mockReturnValue('1')
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
    desc                                                                         | licenceFor | postal   | method      | reminder    | length
    ${'12 month postal licence for you with none digital confirmation'}          | ${true}    | ${true}  | ${'letter'} | ${'phone'}  | ${'12M'}
    ${'12 month postal licence for someone else with none digital confirmation'} | ${false}   | ${true}  | ${'letter'} | ${'phone'}  | ${'12M'}
    ${'12 month postal licence for you with digital confirmation'}               | ${true}    | ${true}  | ${'phone'}  | ${'phone'}  | ${'12M'}
    ${'12 month postal licence for someone else with digital confirmation'}      | ${false}   | ${true}  | ${'phone'}  | ${'phone'}  | ${'12M'}
    ${'12 month digital licence for you'}                                        | ${true}    | ${false} | ${'phone'}  | ${'phone'}  | ${'12M'}
    ${'12 month digital licence for someone else'}                               | ${false}   | ${false} | ${'phone'}  | ${'phone'}  | ${'12M'}
    ${'12 month recurring payment with postal reminder'}                         | ${true}    | ${false} | ${'phone'}  | ${'letter'} | ${'12M'}
    ${'12 month recurring payment with digital reminder'}                        | ${true}    | ${false} | ${'phone'}  | ${'phone'}  | ${'12M'}
    ${'8 day licence sets as non_postal'}                                        | ${true}    | ${true}  | ${'phone'}  | ${'phone'}  | ${'8D'}
  `('$desc', async ({ desc, licenceFor, postal, method, reminder, length }) => {
    const licensee = getSampleLicensee({
      postalFulfilment: postal,
      preferredMethodOfConfirmation: method,
      preferredMethodOfReminder: reminder
    })
    const permission = getSamplePermission({
      isLicenceForYou: licenceFor,
      licensee: licensee,
      licenceLength: length
    })
    const { content } = await getData(getSampleRequest({ permission }))
    expect(content).toMatchSnapshot()
  })

  it('title displays as application when permission is free', async () => {
    const licensee = getSampleLicensee({ preferredMethodOfConfirmation: 'Text' })
    const permission = getSamplePermission({ isLicenceForYou: true, licensee })
    const { content } = await getData(getSampleRequest({ permission, transactionCost: 0 }))
    expect(content.title).toEqual('application title')
  })

  it('passes request and permission to displayStartTime', async () => {
    const permission = getSamplePermission(LICENCE_TYPE['salmon-and-sea-trout'])
    const request = getSampleRequest({ permission })
    await getData(request)
    expect(displayStartTime).toHaveBeenCalledWith(request, permission)
  })

  it('validForRecurringPayment is called with a permission', async () => {
    const permission = getSamplePermission()

    await getData(getSampleRequest({ permission }))

    expect(validForRecurringPayment).toHaveBeenCalledWith(permission)
  })

  it.each`
    agreement | valid    | expected
    ${true}   | ${true}  | ${true}
    ${true}   | ${false} | ${false}
    ${false}  | ${false} | ${false}
    ${false}  | ${true}  | ${false}
  `(
    'recurringPayment returns $expected when status for setup of recurring payment agreement is $agreement and valid for recurring payment is $valid',
    async ({ agreement, valid, expected }) => {
      validForRecurringPayment.mockReturnValueOnce(valid)
      const completionStatus = getSampleCompletionStatus({ setUpPayment: agreement })
      const { recurringPayment } = await getData(getSampleRequest({ completionStatus }))
      expect(recurringPayment).toBe(expected)
    }
  )

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
    title       | method      | postal   | expected
    ${'Email'}  | ${'e-mail'} | ${false} | ${false}
    ${'Text'}   | ${'phone'}  | ${false} | ${false}
    ${'Letter'} | ${'letter'} | ${false} | ${false}
    ${'None'}   | ${'nada'}   | ${false} | ${false}
    ${'Email'}  | ${'e-mail'} | ${true}  | ${true}
    ${'Text'}   | ${'phone'}  | ${true}  | ${true}
  `(
    'when preferredMethodOfConfirmation is $title, postalFulfilment is $postal, digitalLicence equals $expected ',
    async ({ method, postal, expected }) => {
      const licensee = getSampleLicensee({ postalFulfilment: postal, preferredMethodOfConfirmation: method })
      const permission = getSamplePermission({ licensee })
      const { digitalConfirmation } = await getData(getSampleRequest({ permission }))
      expect(digitalConfirmation).toBe(expected)
    }
  )

  it.each`
    title       | method      | postal   | expected
    ${'Email'}  | ${'e-mail'} | ${false} | ${true}
    ${'Text'}   | ${'phone'}  | ${false} | ${true}
    ${'Letter'} | ${'letter'} | ${false} | ${false}
    ${'None'}   | ${'nada'}   | ${false} | ${false}
    ${'Email'}  | ${'e-mail'} | ${true}  | ${false}
    ${'Text'}   | ${'phone'}  | ${true}  | ${false}
  `(
    'when preferredMethodOfConfirmation is $title, postalFulfilment is $postal, digitalLicence equals $expected ',
    async ({ method, postal, expected }) => {
      const licensee = getSampleLicensee({ postalFulfilment: postal, preferredMethodOfConfirmation: method })
      const permission = getSamplePermission({ licensee })
      const { digitalLicence } = await getData(getSampleRequest({ permission }))
      expect(digitalLicence).toBe(expected)
    }
  )

  it.each([true, false])('postalLicence equals %s when same value as postalFulfilment', async postal => {
    const licensee = getSampleLicensee({ postalFulfilment: postal })
    const permission = getSamplePermission({ licensee })
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

  it.each([9.99, 8.71])('passes %d to displayPrice function', async transactionCost => {
    const messages = getMessages()
    await getData(getSampleRequest({ transactionCost, messages }))
    expect(displayPrice).toHaveBeenCalledWith(transactionCost, messages)
  })
})
