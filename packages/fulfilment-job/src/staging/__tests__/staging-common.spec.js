import { getOptionSetEntry, FULFILMENT_FILE_STATUS_OPTIONSET, FULFILMENT_REQUEST_STATUS_OPTIONSET } from '../staging-common.js'
import { GlobalOptionSetDefinition } from '@defra-fish/dynamics-lib'

describe('staging-common', () => {
  describe('getOptionSetEntry', () => {
    it('retrieves a fulfilment file option set item by its label', async () => {
      const result = await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Pending')
      expect(result).toBeInstanceOf(GlobalOptionSetDefinition)
    })
    it('retrieves a fulfilment request option set item by its label', async () => {
      const result = await getOptionSetEntry(FULFILMENT_REQUEST_STATUS_OPTIONSET, 'Pending')
      expect(result).toBeInstanceOf(GlobalOptionSetDefinition)
    })
  })
})
