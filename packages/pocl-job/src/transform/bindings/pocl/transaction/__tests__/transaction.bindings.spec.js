import { Transaction } from '../transaction.bindings.js'
import { POST_OFFICE_DATASOURCE } from '../../../../../staging/constants.js'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    ...Object.keys(jest.requireActual('@defra-fish/connectors-lib').salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn() }), {}),
    ...['permits', 'concessions'].reduce((acc, m) => ({ ...acc, [m]: { find: jest.fn(() => ({ id: `${m}-id` })) } }), {})
  }
}))

describe('transaction transforms', () => {
  it('transforms a POCL record - gmt time, no concession, email contact', async () => {
    const result = await Transaction.transform({
      children: {
        LICENSEE_FORENAME: { value: 'Fester' },
        LICENSEE_SURNAME: { value: 'Tester' },
        DOB: { value: '12/03/1981' },
        NOTIFY_EMAIL_ADDRESS: { value: 'festerthetester123@email.com' },
        NEWSLETTER_OPTION: { value: 'Y' },
        NEWSLETTER_EMAIL_ADDRESS: { value: 'festerthetester456@email.com' },
        NOTIFY_EMAIL: { value: 'Y' },
        NOTIFY_SMS: { value: 'N' },
        NOTIFY_POST: { value: 'N' },
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
        CHANNEL_ID: { value: '123456' }
      }
    })

    expect(result).toStrictEqual({
      id: '559136-2-27950',
      createTransactionPayload: {
        dataSource: POST_OFFICE_DATASOURCE,
        permissions: [
          {
            permitId: 'permits-id',
            issueDate: '2020-01-01T15:03:17.000Z',
            startDate: '2020-01-01T00:01:00.000Z',
            licensee: {
              firstName: 'Fester',
              lastName: 'Tester',
              birthDate: '1981-03-12',
              email: 'festerthetester123@email.com',
              premises: 'PO Box 123, Flat 5, Angling House, 123',
              street: 'Redhill Park, Redhill Lane',
              locality: 'Lower Denton, Denton',
              town: 'Manchester',
              postcode: 'AB123CD',
              country: 'GB',
              preferredMethodOfConfirmation: 'Email',
              preferredMethodOfNewsletter: 'Email',
              preferredMethodOfReminder: 'Email'
            }
          }
        ]
      },
      finaliseTransactionPayload: {
        payment: {
          amount: 3.75,
          method: 'Cash',
          source: POST_OFFICE_DATASOURCE,
          channelId: '123456',
          timestamp: '2020-01-01T15:03:17.000Z'
        }
      }
    })
  })

  it('transforms a POCL record - bst time, senior concession, sms contact', async () => {
    const result = await Transaction.transform({
      children: {
        LICENSEE_FORENAME: { value: 'Fester' },
        LICENSEE_SURNAME: { value: 'Tester' },
        DOB: { value: '12/03/1931' },
        SENIOR_ID: { value: 'Uncancelled Passport' },
        NOTIFY_EMAIL_ADDRESS: { value: '' },
        NEWSLETTER_OPTION: { value: 'N' },
        NEWSLETTER_EMAIL_ADDRESS: { value: '' },
        NOTIFY_SMS_NUMBER: { value: '07124567890' },
        NOTIFY_EMAIL: { value: 'N' },
        NOTIFY_SMS: { value: 'Y' },
        NOTIFY_POST: { value: 'N' },
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
        START_DATE: { value: '01/06/2020' },
        START_TIME: { value: '00:01' },
        SYSTEM_DATE: { value: '01/06/2020' },
        SYSTEM_TIME: { value: '09:00:00' },
        AMOUNT: { value: '3.75' },
        MOPEX: { value: 'UNKNOWN' },
        SERIAL_NO: { value: '559136-2-27950' },
        CHANNEL_ID: { value: '123456' }
      }
    })

    expect(result).toStrictEqual({
      id: '559136-2-27950',
      createTransactionPayload: {
        dataSource: POST_OFFICE_DATASOURCE,
        permissions: [
          {
            permitId: 'permits-id',
            concessions: [
              {
                id: 'concessions-id',
                proof: {
                  referenceNumber: 'N/A',
                  type: 'Uncancelled Passport'
                }
              }
            ],
            issueDate: '2020-06-01T08:00:00.000Z',
            startDate: '2020-05-31T23:01:00.000Z',
            licensee: {
              firstName: 'Fester',
              lastName: 'Tester',
              birthDate: '1931-03-12',
              mobilePhone: '07124567890',
              premises: 'PO Box 123, Flat 5, Angling House, 123',
              street: 'Redhill Park, Redhill Lane',
              locality: 'Lower Denton, Denton',
              town: 'Manchester',
              postcode: 'AB123CD',
              country: 'GB',
              preferredMethodOfConfirmation: 'Text',
              preferredMethodOfNewsletter: 'Prefer not to be contacted',
              preferredMethodOfReminder: 'Text'
            }
          }
        ]
      },
      finaliseTransactionPayload: {
        payment: {
          amount: 3.75,
          method: 'Other',
          source: POST_OFFICE_DATASOURCE,
          channelId: '123456',
          timestamp: '2020-06-01T08:00:00.000Z'
        }
      }
    })
  })

  it('transforms a POCL record - disabled concession (both), letter contact', async () => {
    const result = await Transaction.transform({
      children: {
        LICENSEE_FORENAME: { value: 'Fester' },
        LICENSEE_SURNAME: { value: 'Tester' },
        DOB: { value: '12/03/1931' },
        SENIOR_ID: { value: '' },
        DISABLED_ID_1: { value: '12ABCD01234X5678' },
        DISABLED_ID_2: { value: 'QQ123456C' },
        NOTIFY_EMAIL_ADDRESS: { value: '' },
        NEWSLETTER_OPTION: { value: 'N' },
        NEWSLETTER_EMAIL_ADDRESS: { value: '' },
        NOTIFY_SMS_NUMBER: { value: '' },
        NOTIFY_EMAIL: { value: 'N' },
        NOTIFY_SMS: { value: 'N' },
        NOTIFY_POST: { value: 'Y' },
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
        CHANNEL_ID: { value: '123456' }
      }
    })

    expect(result).toStrictEqual({
      id: '559136-2-27950',
      createTransactionPayload: {
        dataSource: POST_OFFICE_DATASOURCE,
        permissions: [
          {
            permitId: 'permits-id',
            concessions: [
              {
                id: 'concessions-id',
                proof: {
                  referenceNumber: '12ABCD01234X5678',
                  type: 'Blue Badge'
                }
              }
            ],
            issueDate: '2020-01-01T15:03:17.000Z',
            startDate: '2020-01-01T00:01:00.000Z',
            licensee: {
              firstName: 'Fester',
              lastName: 'Tester',
              birthDate: '1931-03-12',
              premises: 'PO Box 123, Flat 5, Angling House, 123',
              street: 'Redhill Park, Redhill Lane',
              locality: 'Lower Denton, Denton',
              town: 'Manchester',
              postcode: 'AB123CD',
              country: 'GB',
              preferredMethodOfConfirmation: 'Letter',
              preferredMethodOfNewsletter: 'Prefer not to be contacted',
              preferredMethodOfReminder: 'Letter'
            }
          }
        ]
      },
      finaliseTransactionPayload: {
        payment: {
          amount: 3.75,
          method: 'Cash',
          source: POST_OFFICE_DATASOURCE,
          channelId: '123456',
          timestamp: '2020-01-01T15:03:17.000Z'
        }
      }
    })
  })

  it('transforms a POCL record - disabled concession (blue badge only), no contact', async () => {
    const result = await Transaction.transform({
      children: {
        LICENSEE_FORENAME: { value: 'Fester' },
        LICENSEE_SURNAME: { value: 'Tester' },
        DOB: { value: '12/03/1931' },
        SENIOR_ID: { value: '' },
        DISABLED_ID_1: { value: '12ABCD01234X5678' },
        DISABLED_ID_2: { value: '' },
        NEWSLETTER_OPTION: { value: 'N' },
        NOTIFY_EMAIL_ADDRESS: { value: '' },
        NEWSLETTER_EMAIL_ADDRESS: { value: '' },
        NOTIFY_SMS_NUMBER: { value: '' },
        NOTIFY_EMAIL: { value: 'N' },
        NOTIFY_SMS: { value: 'N' },
        NOTIFY_POST: { value: 'N' },
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
        CHANNEL_ID: { value: '123456' }
      }
    })

    expect(result).toStrictEqual({
      id: '559136-2-27950',
      createTransactionPayload: {
        dataSource: POST_OFFICE_DATASOURCE,
        permissions: [
          {
            permitId: 'permits-id',
            concessions: [
              {
                id: 'concessions-id',
                proof: {
                  referenceNumber: '12ABCD01234X5678',
                  type: 'Blue Badge'
                }
              }
            ],
            issueDate: '2020-01-01T15:03:17.000Z',
            startDate: '2020-01-01T00:01:00.000Z',
            licensee: {
              firstName: 'Fester',
              lastName: 'Tester',
              birthDate: '1931-03-12',
              premises: 'PO Box 123, Flat 5, Angling House, 123',
              street: 'Redhill Park, Redhill Lane',
              locality: 'Lower Denton, Denton',
              town: 'Manchester',
              postcode: 'AB123CD',
              country: 'GB',
              preferredMethodOfConfirmation: 'Prefer not to be contacted',
              preferredMethodOfNewsletter: 'Prefer not to be contacted',
              preferredMethodOfReminder: 'Prefer not to be contacted'
            }
          }
        ]
      },
      finaliseTransactionPayload: {
        payment: {
          amount: 3.75,
          method: 'Cash',
          source: POST_OFFICE_DATASOURCE,
          channelId: '123456',
          timestamp: '2020-01-01T15:03:17.000Z'
        }
      }
    })
  })

  it('transforms a POCL record - disabled concession (pip only), multiple contact', async () => {
    const result = await Transaction.transform({
      children: {
        LICENSEE_FORENAME: { value: 'Fester' },
        LICENSEE_SURNAME: { value: 'Tester' },
        DOB: { value: '12/03/1931' },
        SENIOR_ID: { value: '' },
        DISABLED_ID_1: { value: '' },
        DISABLED_ID_2: { value: 'QQ123456C' },
        NEWSLETTER_OPTION: { value: 'N' },
        NEWSLETTER_EMAIL_ADDRESS: { value: 'festerthetester456@email.com' },
        NOTIFY_EMAIL: { value: 'N' },
        NOTIFY_SMS: { value: 'Y' },
        NOTIFY_POST: { value: 'N' },
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
        CHANNEL_ID: { value: '123456' }
      }
    })

    expect(result).toStrictEqual({
      id: '559136-2-27950',
      createTransactionPayload: {
        dataSource: POST_OFFICE_DATASOURCE,
        permissions: [
          {
            permitId: 'permits-id',
            concessions: [
              {
                id: 'concessions-id',
                proof: {
                  referenceNumber: 'QQ123456C',
                  type: 'National Insurance Number'
                }
              }
            ],
            issueDate: '2020-01-01T15:03:17.000Z',
            startDate: '2020-01-01T00:01:00.000Z',
            licensee: {
              firstName: 'Fester',
              lastName: 'Tester',
              birthDate: '1931-03-12',
              email: 'festerthetester456@email.com',
              premises: 'PO Box 123, Flat 5, Angling House, 123',
              street: 'Redhill Park, Redhill Lane',
              locality: 'Lower Denton, Denton',
              town: 'Manchester',
              postcode: 'AB123CD',
              country: 'GB',
              preferredMethodOfConfirmation: 'Text',
              preferredMethodOfNewsletter: 'Prefer not to be contacted',
              preferredMethodOfReminder: 'Text'
            }
          }
        ]
      },
      finaliseTransactionPayload: {
        payment: {
          amount: 3.75,
          method: 'Cash',
          source: POST_OFFICE_DATASOURCE,
          channelId: '123456',
          timestamp: '2020-01-01T15:03:17.000Z'
        }
      }
    })
  })
})
