import mockTransaction from './data/mock-transaction.js'
import { preparePayment } from '../govuk-pay-service.js'
import { AGREED } from '../../../constants.js'

describe('The govuk-pay-service', () => {
  it('prepares a correct payment response endpoint for http', async () => {
    process.env.GOV_PAY_HTTPS_REDIRECT = false
    expect(preparePayment(mockTransaction).return_url).toEqual('http://0.0.0.0:3000' + AGREED.uri)
  })

  it('prepares a correct payment response endpoint for https', async () => {
    process.env.GOV_PAY_HTTPS_REDIRECT = true
    expect(preparePayment(mockTransaction).return_url).toEqual('https://0.0.0.0:3000' + AGREED.uri)
  })

  it('prepares a correct payment creation object', async () => {
    process.env.GOV_PAY_HTTPS_REDIRECT = true
    expect(preparePayment(mockTransaction)).toEqual({
      amount: 5400,
      cardholder_name: 'Graham Willis',
      delayed_capture: false,
      description: 'Salmon 12 month 1 Rod Licence (Senior)',
      email: 'angling@email.com',
      reference: '44728b47-c809-4c31-8c92-bdf961be0c80',
      return_url: 'https://0.0.0.0:3000' + AGREED.uri,
      billing_address: {
        city: 'BRISTOL',
        country: 'GB',
        line1: '11 HOWECROFT COURT EASTMEAD LANE',
        postcode: 'BS9 1HJ'
      }
    })
  })

  it('prepares a correct payment creation object where there are multiple licences', async () => {
    const newMockTransaction = Object.assign({}, mockTransaction)
    newMockTransaction.permissions.push(mockTransaction.permissions[0])
    expect(preparePayment(mockTransaction)).toEqual({
      amount: 5400,
      delayed_capture: false,
      description: 'Multiple permits',
      reference: '44728b47-c809-4c31-8c92-bdf961be0c80',
      return_url: 'https://0.0.0.0:3000' + AGREED.uri
    })
  })

  it('posts the prepared payment to the GOV.PAY api', async () => {
    const preparedPayment = preparePayment(mockTransaction)
    console.log(preparedPayment)
  })
})
