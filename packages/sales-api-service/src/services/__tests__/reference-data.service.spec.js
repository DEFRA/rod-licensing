import {
  getReferenceData,
  getReferenceDataForId,
  getGlobalOptionSet,
  getGlobalOptionSets,
  getGlobalOptionSetValue
} from '../reference-data.service.js'
import { Permit, Concession, GlobalOptionSetDefinition } from '@defra-fish/dynamics-lib'

const getOptionSetMappingExpectation = (name, ...keys) => {
  const options = keys.reduce((acc, k) => {
    acc[k] = expect.any(GlobalOptionSetDefinition)
    return acc
  }, {})

  return expect.objectContaining({
    name: name,
    options: expect.objectContaining(options)
  })
}

let apiExecuteBatchSpy, apiRetrieveGlobalOptionSetsSpy
describe('reference-data service', () => {
  beforeAll(async () => {
    const api = require('dynamics-web-api').default
    apiExecuteBatchSpy = jest.spyOn(api.prototype, 'executeBatch')
    apiRetrieveGlobalOptionSetsSpy = jest.spyOn(api.prototype, 'retrieveGlobalOptionSets')
    api.__reset()
    api.__setResponse('executeBatch', [
      {
        value: [
          {
            '@odata.etag': 'W/"22639016"',
            defra_availablefrom: '2017-03-31T23:00:00Z',
            defra_availableto: '2020-03-31T22:59:00Z',
            defra_duration: 910400000,
            defra_durationnumericpart: 1,
            defra_durationdaymonthyearpart: 910400000,
            defra_permittype: 910400000,
            defra_advertisedprice: 6.0,
            defra_permitid: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
            defra_name: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
            defra_permitsubtype: 910400001,
            defra_equipment: 910400000,
            defra_numberofrods: 2,
            defra_isforfulfilment: false,
            defra_iscountersales: true,
            defra_advertisedprice_base: 6.0,
            defra_itemid: '42289'
          }
        ]
      },
      {
        value: [
          {
            '@odata.etag': 'W/"22638892"',
            defra_name: 'Junior',
            defra_concessionid: '3230c68f-ef65-e611-80dc-c4346bad4004'
          }
        ]
      }
    ])
  })

  describe('getReferenceData', () => {
    it('retrieves a map of reference data from the dynamics api', async () => {
      const result = await getReferenceData()
      expect(result).toMatchObject({
        permits: expect.arrayContaining([expect.any(Permit)]),
        concessions: expect.arrayContaining([expect.any(Concession)])
      })
      expect(apiExecuteBatchSpy).toHaveBeenCalledTimes(1)
    })
    it('uses a cache', async () => {
      await getReferenceData()
      await getReferenceData()
      expect(apiExecuteBatchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getReferenceDataForId', () => {
    it('retrieves an entry for a given id', async () => {
      const result = await getReferenceDataForId(Permit, '9d1b34a0-0c66-e611-80dc-c4346bad0190')
      expect(result).toBeInstanceOf(Permit)
      expect(apiExecuteBatchSpy).toHaveBeenCalledTimes(1)
    })
    it('returns undefined if not found', async () => {
      const result = await getReferenceDataForId(Permit, 'not-found')
      expect(result).toBe(undefined)
      expect(apiExecuteBatchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getGlobalOptionSets', () => {
    it('retrieves a map of objects containing option-sets for the defined set of names', async () => {
      const result = await getGlobalOptionSets('defra_duration', 'defra_concessionproof')
      expect(result).toMatchObject(
        expect.objectContaining({
          defra_duration: getOptionSetMappingExpectation('defra_duration', 910400000, 910400001, 910400002, 910400003),
          defra_concessionproof: getOptionSetMappingExpectation('defra_concessionproof', 910400000, 910400001, 910400002, 910400003)
        })
      )
      expect(apiRetrieveGlobalOptionSetsSpy).toHaveBeenCalledTimes(1)
    })
    it('returns an empty object if not found', async () => {
      const result = await getGlobalOptionSets('not-found1', 'not-found2')
      expect(result).toMatchObject({})
      expect(apiRetrieveGlobalOptionSetsSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getGlobalOptionSet', () => {
    it('retrieves all option-sets for a single name', async () => {
      const result = await getGlobalOptionSet('defra_duration')
      expect(result).toMatchObject(getOptionSetMappingExpectation('defra_duration', 910400000, 910400001, 910400002, 910400003))
      expect(apiRetrieveGlobalOptionSetsSpy).toHaveBeenCalledTimes(1)
    })
    it('returns undefined if not found', async () => {
      const result = await getGlobalOptionSet('not-found')
      expect(result).toBe(undefined)
      expect(apiRetrieveGlobalOptionSetsSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getGlobalOptionSetValue', () => {
    it('retrieves a single option-set for a single name and label', async () => {
      const result = await getGlobalOptionSetValue('defra_duration', '1 day')
      expect(result).toBeInstanceOf(GlobalOptionSetDefinition)
      expect(apiRetrieveGlobalOptionSetsSpy).toHaveBeenCalledTimes(1)
    })
    it('returns undefined if the option-set label is not found', async () => {
      const result = await getGlobalOptionSetValue('defra_duration', 'not-found')
      expect(result).toBe(undefined)
      expect(apiRetrieveGlobalOptionSetsSpy).toHaveBeenCalledTimes(1)
    })
    it('returns undefined if the option-set name is not found', async () => {
      const result = await getGlobalOptionSetValue('not-found', 'not-found')
      expect(result).toBe(undefined)
      expect(apiRetrieveGlobalOptionSetsSpy).toHaveBeenCalledTimes(1)
    })
  })
})
