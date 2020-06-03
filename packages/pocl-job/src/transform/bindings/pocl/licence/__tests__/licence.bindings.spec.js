import { ItemId } from '../licence.bindings.js'
import { salesApi } from '@defra-fish/connectors-lib'
jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    ...Object.keys(jest.requireActual('@defra-fish/connectors-lib').salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn() }), {}),
    ...['permits', 'concessions'].reduce((acc, m) => ({ ...acc, [m]: { find: jest.fn(() => ({ id: `${m}-id` })) } }), {})
  }
}))

describe('licence bindings', () => {
  beforeEach(jest.clearAllMocks)

  it('ItemId transform returns the permit id for the given itemId', async () => {
    await expect(ItemId.transform({ value: 'test' })).resolves.toStrictEqual('permits-id')
    expect(salesApi.permits.find).toHaveBeenCalledWith({ itemId: 'test' })
  })

  it('ItemId transform returns undefined if the no value is present in the ITEM_ID element', async () => {
    await expect(ItemId.transform({ value: '' })).resolves.toStrictEqual(undefined)
    expect(salesApi.permits.find).not.toHaveBeenCalled()
  })
})
