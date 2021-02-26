import { Transaction } from '../transaction.bindings.js'
import { POST_OFFICE_DATASOURCE, DIRECT_DEBIT_DATASOURCE } from '../../../../../staging/constants.js'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    ...Object.keys(jest.requireActual('@defra-fish/connectors-lib').salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn() }), {}),
    ...['permits', 'concessions'].reduce((acc, m) => ({ ...acc, [m]: { find: jest.fn(() => ({ id: `${m}-id` })) } }), {})
  }
}))

describe('transaction transforms', () => {
  it('transforms a POCL record - gmt time, no concession, email contact', async () => {
    const result = await Transaction.transform(generateInputJSON())

    expect(result).toMatchSnapshot()
  })

  it('transforms a POCL record - bst time, senior concession, sms contact', async () => {
    const result = await Transaction.transform(
      generateInputJSON({
        DOB: { value: '12/03/1931' },
        SENIOR_ID: { value: 'Uncancelled Passport' },
        NOTIFY_EMAIL_ADDRESS: { value: '' },
        COMMS_EMAIL_ADDRESS: { value: '' },
        NOTIFY_SMS_NUMBER: { value: '07124567890' },
        COMMS_SMS_NUMBER: { value: '07124567891' },
        NOTIFY_EMAIL: { value: 'N' },
        NOTIFY_SMS: { value: 'Y' },
        COMMS_EMAIL: { value: 'N' },
        COMMS_SMS: { value: 'Y' },
        START_DATE: { value: '01/06/2020' },
        SYSTEM_DATE: { value: '01/06/2020' },
        SYSTEM_TIME: { value: '09:00:00' },
        MOPEX: { value: 'UNKNOWN' }
      })
    )

    expect(result).toMatchSnapshot()
  })

  it('transforms a POCL record - disabled concession (both), letter contact', async () => {
    const result = await Transaction.transform(
      generateInputJSON({
        DOB: { value: '12/03/1931' },
        SENIOR_ID: { value: '' },
        DISABLED_ID_1: { value: '12ABCD01234X5678' },
        DISABLED_ID_2: { value: 'QQ123456C' },
        NOTIFY_EMAIL_ADDRESS: { value: '' },
        COMMS_EMAIL_ADDRESS: { value: '' },
        NOTIFY_SMS_NUMBER: { value: '' },
        COMMS_SMS_NUMBER: { value: '' },
        NOTIFY_EMAIL: { value: 'N' },
        NOTIFY_POST: { value: 'Y' },
        COMMS_EMAIL: { value: 'N' },
        COMMS_POST: { value: 'Y' }
      })
    )

    expect(result).toMatchSnapshot()
  })

  it('transforms a POCL record - disabled concession (blue badge only), no contact', async () => {
    const result = await Transaction.transform(
      generateInputJSON({
        DOB: { value: '12/03/1931' },
        SENIOR_ID: { value: '' },
        DISABLED_ID_1: { value: '12ABCD01234X5678' },
        DISABLED_ID_2: { value: '' },
        NOTIFY_EMAIL_ADDRESS: { value: '' },
        COMMS_EMAIL_ADDRESS: { value: '' },
        NOTIFY_SMS_NUMBER: { value: '' },
        COMMS_SMS_NUMBER: { value: '' },
        NOTIFY_EMAIL: { value: 'N' },
        COMMS_EMAIL: { value: 'N' }
      })
    )

    expect(result).toMatchSnapshot()
  })

  it('transforms a POCL record - disabled concession (pip only), multiple contact', async () => {
    const result = await Transaction.transform(
      generateInputJSON({
        DOB: { value: '12/03/1931' },
        SENIOR_ID: { value: '' },
        DISABLED_ID_1: { value: '' },
        DISABLED_ID_2: { value: 'QQ123456C' },
        NOTIFY_EMAIL_ADDRESS: { value: '' },
        COMMS_EMAIL_ADDRESS: { value: 'festerthetester456@email.com' },
        COMMS_SMS_NUMBER: { value: '07124567891' },
        NOTIFY_EMAIL: { value: 'N' },
        NOTIFY_SMS: { value: 'Y' }
      })
    )

    expect(result).toMatchSnapshot()
  })

  it('transforms a DDE record - gmt time, no concession, email contact', async () => {
    const result = await Transaction.transform(
      generateInputJSON({
        DATA_SOURCE: { value: DIRECT_DEBIT_DATASOURCE },
        MOPEX: { value: '6' }
      })
    )

    expect(result).toMatchSnapshot()
  })

  it('ignores invalid datasource', async () => {
    const result = await Transaction.transform(
      generateInputJSON({
        DATA_SOURCE: { value: 'Any old rubbish' }
      })
    )

    expect(result).toEqual(
      expect.objectContaining({
        createTransactionPayload: expect.objectContaining({
          dataSource: POST_OFFICE_DATASOURCE
        }),
        finaliseTransactionPayload: {
          payment: expect.objectContaining({
            source: POST_OFFICE_DATASOURCE
          })
        }
      })
    )
  })
})

const generateInputJSON = (overrides = {}) => ({
  children: {
    LICENSEE_FORENAME: { value: 'Fester' },
    LICENSEE_SURNAME: { value: 'Tester' },
    DOB: { value: '12/03/1981' },
    NOTIFY_EMAIL_ADDRESS: { value: 'festerthetester123@email.com' },
    COMMS_EMAIL_ADDRESS: { value: 'festerthetester456@email.com' },
    NOTIFY_EMAIL: { value: 'Y' },
    NOTIFY_SMS: { value: 'N' },
    NOTIFY_POST: { value: 'N' },
    COMMS_EMAIL: { value: 'Y' },
    COMMS_SMS: { value: 'N' },
    COMMS_POST: { value: 'N' },
    LICENSEE_ADDRESS: {
      children: {
        POBox: { value: 'PO Box 123' },
        Subprem: { value: 'Flat 5' },
        Buildname: { value: 'Angling House' },
        Buildnum: { value: '123' },
        Depthoro: { value: 'Redhill Park' },
        Thoro: { value: 'Redhill Lane' },
        Deplocal: { value: 'Lower Denton' },
        Local: { value: 'Denton' },
        Town: { value: 'Manchester' },
        Postcode: { value: 'AB123CD' }
      }
    },
    ITEM_ID: { value: '123456' },
    START_DATE: { value: '01/01/2020' },
    START_TIME: { value: '00:01' },
    SYSTEM_DATE: { value: '01/01/2020' },
    SYSTEM_TIME: { value: '15:03:17' },
    AMOUNT: { value: '3.75' },
    MOPEX: { value: '1' },
    SERIAL_NO: { value: '559136-2-27950' },
    CHANNEL_ID: { value: '123456' },
    ...overrides
  }
})
