import mockTransaction from './data/mock-transaction.js'
import { preparePayment } from '../../../processors/payment.js'
import { AGREED } from '../../../uri.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

jest.mock('../../../processors/uri-helper.js')

describe('The govuk-pay-service', () => {
  it('prepares a correct payment response endpoint for http', async () => {
    addLanguageCodeToUri.mockReturnValue('http://0.0.0.0:3000/buy/agreed')

    expect(
      preparePayment(
        {
          i18n: {
            getCatalog: () => ({
              over_66: 'Over 66',
              licence_type_radio_trout_three_rod_payment_summary: 'trout and coarse (up to 3 rods)'
            })
          },
          info: { host: '0.0.0.0:3000' },
          headers: { 'x-forwarded-proto': 'http' }
        },
        mockTransaction
      ).return_url
    ).toEqual('http://0.0.0.0:3000' + AGREED.uri)
  })

  it('prepares a correct payment response endpoint for https', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    expect(
      preparePayment(
        {
          i18n: {
            getCatalog: () => ({
              over_66: 'Over 66',
              licence_type_radio_trout_three_rod_payment_summary: 'trout and coarse (up to 3 rods)'
            })
          },
          info: { host: '0.0.0.0:3000' },
          headers: { 'x-forwarded-proto': 'https' }
        },
        mockTransaction
      ).return_url
    ).toEqual('https://0.0.0.0:3000' + AGREED.uri)
  })

  it('prepares a correct payment creation object', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    expect(
      preparePayment(
        {
          i18n: {
            getCatalog: () => ({
              over_66: ' (Over 66)',
              licence_type_radio_salmon_payment_summary: 'salmon and sea trout',
              licence_12_month: '12-month'
            })
          },
          info: { host: '0.0.0.0:3000' },
          headers: {},
          server: { info: { protocol: 'https' } }
        },
        mockTransaction
      )
    ).toEqual({
      amount: 5400,
      delayed_capture: false,
      description: '12-month salmon and sea trout (Over 66)',
      email: 'angling@email.com',
      reference: '44728b47-c809-4c31-8c92-bdf961be0c80',
      return_url: 'https://0.0.0.0:3000' + AGREED.uri,
      moto: false,
      language: 'en',
      prefilled_cardholder_details: {
        cardholder_name: 'Graham Willis',
        billing_address: {
          city: 'BRISTOL',
          country: 'GB',
          line1: '11 HOWECROFT COURT EASTMEAD LANE',
          postcode: 'BS9 1HJ'
        }
      }
    })
  })

  it('prepares a correct payment creation object - with locality', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    const mockTransaction2 = Object.assign({}, mockTransaction)
    mockTransaction2.permissions[0].licensee.locality = 'Stoke Bishop'
    mockTransaction2.permissions[0].licenceLength = '8D'
    expect(
      preparePayment(
        {
          i18n: {
            getCatalog: () => ({
              over_66: ' (Over 66)',
              licence_type_radio_salmon_payment_summary: 'salmon and sea trout',
              licence_8_day: '8-day'
            })
          },
          info: { host: '0.0.0.0:3000' },
          headers: { 'x-forwarded-proto': 'https' }
        },
        mockTransaction2
      )
    ).toEqual({
      amount: 5400,
      delayed_capture: false,
      description: '8-day salmon and sea trout (Over 66)',
      email: 'angling@email.com',
      reference: '44728b47-c809-4c31-8c92-bdf961be0c80',
      return_url: 'https://0.0.0.0:3000' + AGREED.uri,
      moto: false,
      language: 'en',
      prefilled_cardholder_details: {
        cardholder_name: 'Graham Willis',
        billing_address: {
          city: 'BRISTOL',
          country: 'GB',
          line1: '11 HOWECROFT COURT EASTMEAD LANE',
          line2: 'Stoke Bishop',
          postcode: 'BS9 1HJ'
        }
      }
    })
  })

  it('prepares a correct payment creation object where there are multiple licences', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    const newMockTransaction = Object.assign({}, mockTransaction)
    newMockTransaction.permissions.push(mockTransaction.permissions[0])
    expect(preparePayment({ info: { host: '0.0.0.0:3000' }, headers: { 'x-forwarded-proto': 'https' } }, newMockTransaction)).toEqual({
      amount: 5400,
      delayed_capture: false,
      description: 'Multiple permits',
      reference: '44728b47-c809-4c31-8c92-bdf961be0c80',
      return_url: 'https://0.0.0.0:3000' + AGREED.uri,
      moto: false,
      language: 'en'
    })
  })

  it('posts the prepared payment to the GOV.PAY api', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    const preparedPayment = preparePayment({ info: { host: '0.0.0.0:3000' }, headers: { 'x-forwarded-proto': 'https' } }, mockTransaction)
    console.log(preparedPayment)
  })
})
