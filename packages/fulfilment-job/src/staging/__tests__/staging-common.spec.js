import { getOptionSetEntry, FULFILMENT_FILE_STATUS_OPTIONSET, FULFILMENT_REQUEST_STATUS_OPTIONSET } from '../staging-common.js'

describe('staging-common', () => {
  describe('getOptionSetEntry', () => {
    it('retrieves a fulfilment file option set item by its label', async () => {
      const result = await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Pending')
      expect(result).toMatchObject({
        id: 910400000,
        label: 'Pending',
        description: 'Pending'
      })
    })

    it('retrieves a fulfilment request option set item by its label', async () => {
      const result = await getOptionSetEntry(FULFILMENT_REQUEST_STATUS_OPTIONSET, 'Pending')
      expect(result).toMatchObject({
        id: 910400000,
        label: 'Pending',
        description: 'Pending'
      })
    })
  })
})
