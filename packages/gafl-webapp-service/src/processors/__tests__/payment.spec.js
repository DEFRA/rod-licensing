import { preparePayment, prepareRecurringPaymentAgreement } from '../payment.js'
import { licenceTypeAndLengthDisplay } from '../licence-type-display.js'
import { addLanguageCodeToUri } from '../uri-helper.js'
import { AGREED } from '../../uri.js'
import db from 'debug'
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:payment-processors')]

jest.mock('../uri-helper.js')

jest.mock('../licence-type-display.js')
licenceTypeAndLengthDisplay.mockReturnValue('Trout and coarse, up to 2 rods, 8 day')
jest.mock('debug', () => jest.fn(() => jest.fn()))

const createRequest = (opts = {}, englishCatalog = {}, welshCatalog = {}) => ({
  i18n: {
    getCatalog: lang => {
      if (lang === 'en') {
        return englishCatalog
      }
      if (lang === 'cy') {
        return welshCatalog
      }
    }
  },
  headers: opts.headers || { 'x-forwarded-proto': 'https' },
  info: { host: opts.host || 'localhost:1234' },
  server: { info: { protocol: opts.protocol || '' } }
})

const createTransaction = ({
  isLicenceForYou = true,
  additionalPermissions = [],
  cost = 12,
  licenseeOverrides = {},
  agreementId
} = {}) => ({
  id: 'transaction-id',
  cost,
  agreementId,
  permissions: [
    {
      id: 'permission-id',
      licensee: {
        firstName: 'Lando',
        lastName: 'Norris',
        email: 'test@example.com',
        premises: '4',
        street: 'Buttercup lane',
        locality: 'Clifton',
        postcode: 'BS8 3TP',
        town: 'Bristol',
        country: 'GB-ENG',
        ...licenseeOverrides
      },
      isLicenceForYou
    },
    ...additionalPermissions
  ]
})

describe('preparePayment', () => {
  describe('provides the correct return url', () => {
    it.each(['http', 'https'])('uses SSL when "x-forwarded-proto" header is present, proto "%s"', proto => {
      addLanguageCodeToUri.mockReturnValue(proto + '://localhost:1234/buy/agreed')
      const request = createRequest({ headers: { 'x-forwarded-proto': proto } })
      const result = preparePayment(request, createTransaction(), false)

      expect(result.return_url).toBe(`${proto}://localhost:1234/buy/agreed`)
    })

    it.each([
      ['http', 'localhost:4321'],
      ['https', 'otherhost:8888'],
      ['http', 'samplehost:4444']
    ])('uses request data when "x-forwarded-proto" header is not present, protocol "%s", host "%s"', (protocol, host) => {
      addLanguageCodeToUri.mockReturnValue(protocol + '://' + host + '/buy/agreed')
      const request = createRequest({ headers: {}, protocol, host })
      const result = preparePayment(request, createTransaction())
      expect(result.return_url).toBe(`${protocol}://${host}/buy/agreed`)
    })

    it('calls addLanguageCodeToUri with correct arguments', () => {
      const request = createRequest()
      preparePayment(request, createTransaction())
      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, AGREED.uri)
    })
  })

  it.each`
    transaction                          | expectedAmount
    ${createTransaction()}               | ${1200}
    ${createTransaction({ cost: 35.8 })} | ${3580}
  `('provides the correct transaction amount of $expectedAmount when cost is $transaction.cost', ({ transaction, expectedAmount }) => {
    const result = preparePayment(createRequest(), transaction)
    expect(result.amount).toBe(expectedAmount)
  })

  it('provides the correct reference', () => {
    const transaction = createTransaction()
    const result = preparePayment(createRequest(), transaction)
    expect(result.reference).toBe(transaction.id)
  })

  it('licenceTypeAndLengthDisplay is called with the expected arguments', () => {
    const catalog = Symbol('mock catalog')
    const request = createRequest({}, catalog)
    const transaction = createTransaction()
    const permission = transaction.permissions[0]

    preparePayment(request, transaction)

    expect(licenceTypeAndLengthDisplay).toHaveBeenCalledWith(permission, catalog)
  })

  it('return value of licenceTypeDisplay', () => {
    const returnValue = Symbol('return value')
    licenceTypeAndLengthDisplay.mockReturnValueOnce(returnValue)

    const result = preparePayment(createRequest(), createTransaction())
    const ret = result.description

    expect(ret).toEqual(returnValue)
  })

  it.each([
    ['when the language is set to Welsh', 'https://localhost:1234/buy/agreed?lang=cy', 'cy'],
    ['when the language is set to English', 'https://localhost:1234/buy/agreed?lang=en', 'en'],
    ['when the language is not set', 'https://localhost:1234/buy/agreed', 'en']
  ])('provides the correct language %s', (_desc, decoratedUrl, expectedLanguageCode) => {
    addLanguageCodeToUri.mockReturnValue(decoratedUrl)
    const result = preparePayment(createRequest(), createTransaction())
    expect(result.language).toEqual(expectedLanguageCode)
  })

  it('when journey is Welsh, the payment description still uses the English catalog', () => {
    const englishCatalog = { lang: 'en' }
    const welshCatalog = { lang: 'cy' }

    addLanguageCodeToUri.mockReturnValue('https://localhost:1234/buy/agreed?lang=cy')

    const request = createRequest({}, englishCatalog, welshCatalog)
    const transaction = createTransaction()

    preparePayment(request, transaction)

    expect(licenceTypeAndLengthDisplay).toHaveBeenCalledWith(transaction.permissions[0], englishCatalog)
  })

  describe('provides the correct description', () => {
    it('when there is only 1 permission', () => {
      const result = preparePayment(createRequest(), createTransaction())
      expect(result.description).toBe('Trout and coarse, up to 2 rods, 8 day')
    })

    it('when there are multiple permissions', () => {
      const additionalPermissions = [{ licensee: { firstName: 'Test' } }]
      const transaction = createTransaction({ additionalPermissions })
      const result = preparePayment(createRequest(), transaction)
      expect(result.description).toBe('Multiple permits')
    })
  })

  describe('if there is only 1 permission and the user is buying for themselves, provides licensee info', () => {
    it('provides the licensee name as cardholder name', () => {
      const transaction = createTransaction()
      const licensee = transaction.permissions[0].licensee
      const result = preparePayment(createRequest(), transaction)

      expect(result.prefilled_cardholder_details.cardholder_name).toBe(`${licensee.firstName} ${licensee.lastName}`)
    })

    describe('provides the licensee address correctly', () => {
      it('line1 includes street name if provided', () => {
        const transaction = createTransaction()
        const licensee = transaction.permissions[0].licensee
        const result = preparePayment(createRequest(), transaction)

        expect(result.prefilled_cardholder_details.billing_address.line1).toBe(`${licensee.premises} ${licensee.street}`)
      })

      it('line1 does not include street name if not provided', () => {
        const transaction = createTransaction({ licenseeOverrides: { street: null } })
        const licensee = transaction.permissions[0].licensee
        const result = preparePayment(createRequest(), transaction)

        expect(result.prefilled_cardholder_details.billing_address.line1).toBe(licensee.premises)
      })

      it('postcode is provided', () => {
        const transaction = createTransaction()
        const licensee = transaction.permissions[0].licensee
        const result = preparePayment(createRequest(), transaction)
        expect(result.prefilled_cardholder_details.billing_address.postcode).toBe(licensee.postcode)
      })

      it('city is provided', () => {
        const transaction = createTransaction()
        const licensee = transaction.permissions[0].licensee
        const result = preparePayment(createRequest(), transaction)

        expect(result.prefilled_cardholder_details.billing_address.city).toBe(licensee.town)
      })

      it('country is provided', () => {
        const transaction = createTransaction()
        const licensee = transaction.permissions[0].licensee
        const result = preparePayment(createRequest(), transaction)

        expect(result.prefilled_cardholder_details.billing_address.country).toBe(licensee.countryCode)
      })

      it('line2 is provided if locality is present', () => {
        const transaction = createTransaction()
        const licensee = transaction.permissions[0].licensee
        const result = preparePayment(createRequest(), transaction)

        expect(result.prefilled_cardholder_details.billing_address.line2).toBe(licensee.locality)
      })

      it('line2 is undefined if locality is not present', () => {
        const transaction = createTransaction({ licenseeOverrides: { locality: null } })
        const result = preparePayment(createRequest(), transaction)

        expect(result.prefilled_cardholder_details.billing_address.line2).toBe(undefined)
      })
    })
  })

  describe('if there is only 1 permission and the user is buying on behalf of another, does not provide licensee info', () => {
    it('does not provide the prefilled_cardholder_details', () => {
      const boboTransaction = createTransaction({ isLicenceForYou: false })
      const result = preparePayment(createRequest(), boboTransaction)
      expect(result.prefilled_cardholder_details).toBe(undefined)
    })

    it('does not provide the email', () => {
      const boboTransaction = createTransaction({ isLicenceForYou: false })
      const result = preparePayment(createRequest(), boboTransaction)
      expect(result.email).toBe(undefined)
    })
  })

  describe('if agreementId is not present', () => {
    it('does not include set_up_agreement', () => {
      const result = preparePayment(createRequest(), createTransaction())
      expect(result.set_up_agreement).toBe(undefined)
    })
  })

  describe('if agreementId is present', () => {
    it('set_up_agreement is set to agreementId', () => {
      const agreementId = 'foo'
      const recurringPaymentTransaction = createTransaction({ agreementId })

      const result = preparePayment(createRequest(), recurringPaymentTransaction)

      expect(result.set_up_agreement).toBe(agreementId)
    })
  })
})

describe('prepareRecurringPaymentAgreement', () => {
  it('reference equals transaction.id', async () => {
    const transaction = createTransaction()
    const result = await prepareRecurringPaymentAgreement(createRequest(), transaction)
    expect(result.reference).toBe(transaction.id)
  })

  it('description equals the recurring payment description from catalog', async () => {
    const mockCatalog = {
      recurring_payment_description: 'The recurring card payment for your rod fishing licence'
    }
    const request = createRequest({}, mockCatalog)
    const transaction = createTransaction()

    const result = await prepareRecurringPaymentAgreement(request, transaction)
    expect(result.description).toBe(mockCatalog.recurring_payment_description)
  })

  it('logs to debug for recurring payment', async () => {
    const transaction = createTransaction()
    const request = createRequest()

    const result = await prepareRecurringPaymentAgreement(request, transaction)
    expect(debug).toHaveBeenCalledWith('Creating prepared recurring payment agreement %o', result)
  })

  it('when the recurring-payment journey is Welsh, the agreement description still uses the English catalog', async () => {
    const englishCatalog = {
      lang: 'en',
      recurring_payment_description: 'The recurring card payment for your rod fishing licence'
    }
    const welshCatalog = {
      lang: 'cy',
      recurring_payment_description: 'Y taliad cerdyn sy’n ailadrodd ar gyfer eich trwydded bysgota â gwialen'
    }

    const request = createRequest({}, englishCatalog, welshCatalog)
    const transaction = createTransaction()

    const result = await prepareRecurringPaymentAgreement(request, transaction)

    expect(result.description).toBe(englishCatalog.recurring_payment_description)
  })
})
