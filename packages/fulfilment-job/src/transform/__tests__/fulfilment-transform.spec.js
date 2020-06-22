import { fulfilmentDataTransformer } from '../fulfilment-transform.js'
import {
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_1DAY_FULL_PERMIT_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY
} from '../../../../sales-api-service/src/__mocks__/test-data.js'

describe('fulfilment-transform', () => {
  it('exposes a generator function to transform the entity model', async () => {
    const testData = {
      permission: MOCK_EXISTING_PERMISSION_ENTITY,
      licensee: MOCK_EXISTING_CONTACT_ENTITY,
      permit: MOCK_1DAY_FULL_PERMIT_ENTITY
    }

    const transform = await fulfilmentDataTransformer([testData])
    let result = ''
    let yielded = {}
    do {
      yielded = await transform.next()
      if (!yielded.done) {
        result += yielded.value
      }
    } while (!yielded.done)
    expect(JSON.parse(result)).toStrictEqual({
      holder: {
        address: {
          organisation: 'Test Organisation',
          premises: '1',
          street: 'Tester Avenue',
          locality: 'Testville',
          town: 'Tersterton',
          postcode: 'AB12 3CD',
          country: 'United Kingdom'
        },
        dateOfBirth: {
          id: expect.any(String),
          value: '1946-01-01'
        },
        name: {
          firstName: 'Fester',
          surname: 'Tester'
        }
      },
      licence: {
        type: 'Rod Fishing Licence',
        subtype: 'Trout and coarse',
        description: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
        duration: '1 Day(s)',
        equipment: '2 rod(s)',
        issueDateAndTime: '2019-12-13T09:00:00Z',
        startDateAndTime: '2019-12-14T00:00:00Z',
        expiryDateAndTime: '2020-12-13T23:59:59Z',
        licenceNumber: '2WC3FDR-CD379B',
        cost: 6,
        paymentCurrency: 'GBP'
      }
    })
  })
})
