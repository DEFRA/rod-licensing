import { preparePayment } from '../payment.js'
import { licenceTypeAndLengthDisplay } from '../licence-type-display.js'

jest.mock('../licence-type-display.js')
licenceTypeAndLengthDisplay.mockReturnValue('Trout and coarse, up to 2 rods, 8 day')

const createRequest = (opts = {}) => ({
  headers: opts.headers || { 'x-forwarded-proto': 'https' },
  info: { host: opts.host || 'localhost:1234' },
  server: { info: { protocol: opts.protocol || '' } }
})

const createTransaction = () => ({
  id: 'transaction-id',
  cost: 12,
  permissions: [
    {
      licensee: {
        firstName: 'Lando',
        lastName: 'Norris',
        email: 'test@example.com',
        premises: '4',
        street: 'Buttercup lane',
        locality: 'Clifton',
        postcode: 'BS8 3TP',
        town: 'Bristol',
        country: 'GB-ENG'
      }
    }
  ]
})

describe('preparePayment', () => {
  let request, transaction, result
  beforeEach(() => {
    request = createRequest()
    transaction = createTransaction()
    result = preparePayment(request, transaction)
  })

  describe('provides the correct return url', () => {
    it.each(['http', 'https'])('uses SSL when "x-forwarded-proto" header is present, proto "%s"', proto => {
      const request = createRequest({ headers: { 'x-forwarded-proto': proto } })
      result = preparePayment(request, transaction)
      expect(result.return_url).toBe(`${proto}://localhost:1234/buy/agreed`)
    })

    it.each([
      ['http', 'localhost:4321'],
      ['https', 'otherhost:8888'],
      ['http', 'samplehost:4444']
    ])('uses request data when "x-forwarded-proto" header is not present, protocol "%s", host "%s"', (protocol, host) => {
      const request = createRequest({ headers: {}, protocol, host })
      result = preparePayment(request, transaction)
      expect(result.return_url).toBe(`${protocol}://${host}/buy/agreed`)
    })
  })

  it('provides the correct transaction amount', () => {
    expect(result.amount).toBe(1200)
  })

  it('provides the correct reference', () => {
    expect(result.reference).toBe(transaction.id)
  })

  describe('provides the correct description', () => {
    it('when there is only 1 permission', () => {
      expect(result.description).toBe('Trout and coarse, up to 2 rods, 8 day')
    })

    it('when there are multiple permissions', () => {
      transaction.permissions.push({ licensee: { firstName: 'Test' } })
      const result = preparePayment(request, transaction)
      expect(result.description).toBe('Multiple permits')
    })
  })

  describe('if there is only 1 permission, provides licensee info', () => {
    let licensee
    beforeEach(() => {
      licensee = transaction.permissions[0].licensee
    })
    it('provides the licensee name as cardholder name', () => {
      expect(result.prefilled_cardholder_details.cardholder_name).toBe(`${licensee.firstName} ${licensee.lastName}`)
    })

    describe('provides the licensee address correctly', () => {
      it('line1 includes street name if provided', () => {
        expect(result.prefilled_cardholder_details.billing_address.line1).toBe(`${licensee.premises} ${licensee.street}`)
      })

      it('line1 does not include street name if not provided', () => {
        delete transaction.permissions[0].licensee.street
        const result = preparePayment(request, transaction)
        expect(result.prefilled_cardholder_details.billing_address.line1).toBe(licensee.premises)
      })

      it('postcode is provided', () => {
        expect(result.prefilled_cardholder_details.billing_address.postcode).toBe(licensee.postcode)
      })

      it('city is provided', () => {
        expect(result.prefilled_cardholder_details.billing_address.city).toBe(licensee.town)
      })

      it('country is provided', () => {
        expect(result.prefilled_cardholder_details.billing_address.country).toBe(licensee.countryCode)
      })

      it('line2 is provided', () => {
        expect(result.prefilled_cardholder_details.billing_address.line2).toBe(licensee.locality)
      })

      it('line2 is undefined if not provided', () => {
        delete transaction.permissions[0].licensee.locality
        const result = preparePayment(request, transaction)
        expect(result.prefilled_cardholder_details.billing_address.locality).toBe(undefined)
      })
    })
  })
})
