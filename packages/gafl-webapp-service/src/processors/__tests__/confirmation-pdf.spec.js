import { orderConfirmationPdf } from '../confirmation-pdf.js'
import { addJunior } from '../concession-helper.js'

const disabledPermission = {
  licensee: {
    birthDate: '1970-01-01',
    firstName: 'Graham',
    lastName: 'Willis',
    premises: '3',
    town: 'BRISTOL',
    postcode: 'BS9 4PT',
    countryCode: 'GB',
    street: 'CROFT VIEW',
    preferredMethodOfNewsletter: 'Email',
    preferredMethodOfConfirmation: 'Letter',
    preferredMethodOfReminder: 'Letter'
  },
  licenceStartTime: null,
  licenceLength: '12M',
  licenceType: 'Trout and coarse',
  numberOfRods: '3',
  licenceToStart: 'another-date-or-time',
  licenceStartDate: '2020-05-23',
  concessions: [
    {
      type: 'Disabled',
      proof: {
        type: 'National Insurance Number',
        referenceNumber: 'QQ 12 34 56 C'
      }
    }
  ],
  referenceNumber: '01230521-3WC3FGW-43Y0BP',
  endDate: '2021-05-22T23:00:00.000Z',
  permit: {
    cost: 0
  }
}

const indexMap = {
  TYPE: 1,
  LENGTH: 2,
  CONCESSION: 3,
  COST: 6
}
const tableContentByIndex = (result, idx) => result.content[4].table.body[idx][1].text

describe('The PDF generator', () => {
  it('completes for a disabled concession trout and coarse licence', () => {
    const result = orderConfirmationPdf(disabledPermission)
    expect(tableContentByIndex(result, indexMap.TYPE)).toBe('Trout and coarse, up to 3 rods')
    expect(tableContentByIndex(result, indexMap.CONCESSION)).toBe('yes')
  })

  it('completes for a salmon and sea trout licence', () => {
    const permission = Object.assign({}, disabledPermission)
    permission.licenceType = 'Salmon and sea trout'
    permission.concessions = []
    permission.permit.cost = 91
    const result = orderConfirmationPdf(permission)
    expect(tableContentByIndex(result, indexMap.TYPE)).toBe('Salmon and sea trout')
    expect(tableContentByIndex(result, indexMap.CONCESSION)).toBe('no')
    expect(tableContentByIndex(result, indexMap.COST)).toBe('£91')
  })

  it('completes for junior licence', () => {
    const permission = Object.assign({}, disabledPermission)
    addJunior(permission)
    const result = orderConfirmationPdf(permission)
    expect(tableContentByIndex(result, indexMap.TYPE)).toBe('Junior, Trout and coarse, up to 3 rods')
  })

  it('completes for a 1 Day licence', () => {
    const permission = Object.assign({}, disabledPermission)
    permission.licenceLength = '1D'
    permission.numberOfRods = '2'
    permission.concessions = []
    const result = orderConfirmationPdf(permission)
    expect(tableContentByIndex(result, indexMap.LENGTH)).toBe('1 day')
  })

  it('completes for an 8 Day licence', () => {
    const permission = Object.assign({}, disabledPermission)
    permission.licenceLength = '8D'
    permission.numberOfRods = '2'
    permission.concessions = []
    const result = orderConfirmationPdf(permission)
    expect(tableContentByIndex(result, indexMap.LENGTH)).toBe('8 days')
  })
})
