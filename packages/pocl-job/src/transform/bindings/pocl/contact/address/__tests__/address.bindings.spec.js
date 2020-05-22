import { Address } from '../address.bindings.js'

describe('address transforms', () => {
  it('transforms a POCL record with a full PAF address', async () => {
    const result = await Address.transform({
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
    })

    expect(result).toStrictEqual({
      premises: 'PO Box 123, Flat 5, Angling House, 123',
      street: 'Redhill Park, Redhill Lane',
      locality: 'Lower Denton, Denton',
      town: 'Manchester',
      postcode: 'AB123CD',
      country: 'GB'
    })
  })

  it('transforms a POCL record with a partial PAF address', async () => {
    const result = await Address.transform({
      children: {
        Buildnum: { value: '456' },
        Thoro: { value: 'Redhill Lane' },
        Town: { value: 'Manchester' },
        Postcode: { value: 'AB123CD' }
      }
    })

    expect(result).toStrictEqual({
      premises: '456',
      street: 'Redhill Lane',
      town: 'Manchester',
      postcode: 'AB123CD',
      country: 'GB'
    })
  })

  it('transforms a POCL record with a manually entered address', async () => {
    const result = await Address.transform({
      children: {
        Premises: { value: 'PO Box 123, Flat 5, Angling House, 123' },
        Address: { value: 'Redhill Park, Redhill Lane' },
        ContAddress: { value: 'Lower Denton, Denton' },
        TownCity: { value: 'Manchester' },
        PostcodeZip: { value: 'AB123CD' }
      }
    })
    expect(result).toStrictEqual({
      premises: 'PO Box 123, Flat 5, Angling House, 123',
      street: 'Redhill Park, Redhill Lane',
      locality: 'Lower Denton, Denton',
      town: 'Manchester',
      postcode: 'AB123CD',
      country: 'GB'
    })
  })
})
