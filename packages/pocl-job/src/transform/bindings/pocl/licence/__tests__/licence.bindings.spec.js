import { Permit } from '../licence.bindings.js'
import { salesApi } from '@defra-fish/connectors-lib'
jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    ...Object.keys(jest.requireActual('@defra-fish/connectors-lib').salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn() }), {}),
    ...['permits', 'concessions'].reduce(
      (acc, m) => ({
        ...acc,
        [m]: { find: jest.fn(() => ({ id: `${m}-id`, description: 'Coarse 1 day 2 Rod Licence (Full)', isForFulfilment: false })) }
      }),
      {}
    )
  }
}))

describe('licence bindings', () => {
  beforeEach(jest.clearAllMocks)

  it('Permit transform returns the permit for the given itemId', async () => {
    await expect(Permit.transform({ value: 'test' })).resolves.toStrictEqual({
      id: 'permits-id',
      description: 'Coarse 1 day 2 Rod Licence (Full)',
      isForFulfilment: false
    })
    expect(salesApi.permits.find).toHaveBeenCalledWith({ itemId: 'test' })
  })

  it('Permit transform returns undefined if the no value is present in the ITEM_ID element', async () => {
    await expect(Permit.transform({ value: '' })).resolves.toStrictEqual(undefined)
    expect(salesApi.permits.find).not.toHaveBeenCalled()
  })
})
