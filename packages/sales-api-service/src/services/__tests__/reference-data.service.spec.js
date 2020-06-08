import {
  getReferenceData,
  getReferenceDataForEntityAndId,
  getGlobalOptionSet,
  getGlobalOptionSets,
  getGlobalOptionSetValue,
  getReferenceDataForEntity
} from '../reference-data.service.js'
import { Permit, Concession, GlobalOptionSetDefinition } from '@defra-fish/dynamics-lib'
import {
  MOCK_12MONTH_SENIOR_PERMIT_DYNAMICS_RESPONSE,
  MOCK_1DAY_SENIOR_PERMIT_DYNAMICS_RESPONSE,
  MOCK_CONCESSION_DYNAMICS_RESPONSE
} from '../../__mocks__/test-data.js'
import dynamicsWebApi from 'dynamics-web-api'

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

describe('reference-data service', () => {
  beforeAll(async () => {
    dynamicsWebApi.__reset()
    dynamicsWebApi.__setResponse('executeBatch', [
      {
        value: [MOCK_12MONTH_SENIOR_PERMIT_DYNAMICS_RESPONSE, MOCK_1DAY_SENIOR_PERMIT_DYNAMICS_RESPONSE]
      },
      {
        value: [MOCK_CONCESSION_DYNAMICS_RESPONSE]
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
      expect(dynamicsWebApi.prototype.executeBatch).toHaveBeenCalledTimes(1)
    })
    it('uses a cache', async () => {
      await getReferenceData()
      await getReferenceData()
      expect(dynamicsWebApi.prototype.executeBatch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getReferenceDataForEntity', () => {
    it('retrieves an entries for the given type', async () => {
      const result = await getReferenceDataForEntity(Permit)
      expect(result).toEqual(expect.arrayContaining([expect.any(Permit)]))
      expect(dynamicsWebApi.prototype.executeBatch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getReferenceDataForEntityAndId', () => {
    it('retrieves an entry for a given id', async () => {
      const result = await getReferenceDataForEntityAndId(Permit, MOCK_12MONTH_SENIOR_PERMIT_DYNAMICS_RESPONSE.defra_permitid)
      expect(result).toBeInstanceOf(Permit)
      expect(dynamicsWebApi.prototype.executeBatch).toHaveBeenCalledTimes(1)
    })
    it('returns undefined if not found', async () => {
      const result = await getReferenceDataForEntityAndId(Permit, 'not-found')
      expect(result).toBe(undefined)
      expect(dynamicsWebApi.prototype.executeBatch).toHaveBeenCalledTimes(1)
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
      expect(dynamicsWebApi.prototype.retrieveGlobalOptionSets).toHaveBeenCalledTimes(1)
    })
    it('returns an empty object if not found', async () => {
      const result = await getGlobalOptionSets('not-found1', 'not-found2')
      expect(result).toMatchObject({})
      expect(dynamicsWebApi.prototype.retrieveGlobalOptionSets).toHaveBeenCalledTimes(1)
    })
  })

  describe('getGlobalOptionSet', () => {
    it('retrieves all option-sets for a single name', async () => {
      const result = await getGlobalOptionSet('defra_duration')
      expect(result).toMatchObject(getOptionSetMappingExpectation('defra_duration', 910400000, 910400001, 910400002, 910400003))
      expect(dynamicsWebApi.prototype.retrieveGlobalOptionSets).toHaveBeenCalledTimes(1)
    })
    it('returns undefined if not found', async () => {
      const result = await getGlobalOptionSet('not-found')
      expect(result).toBe(undefined)
      expect(dynamicsWebApi.prototype.retrieveGlobalOptionSets).toHaveBeenCalledTimes(1)
    })
  })

  describe('getGlobalOptionSetValue', () => {
    it('retrieves a single option-set for a single name and label', async () => {
      const result = await getGlobalOptionSetValue('defra_duration', '1 day')
      expect(result).toBeInstanceOf(GlobalOptionSetDefinition)
      expect(dynamicsWebApi.prototype.retrieveGlobalOptionSets).toHaveBeenCalledTimes(1)
    })
    it('returns undefined if the option-set label is not found', async () => {
      const result = await getGlobalOptionSetValue('defra_duration', 'not-found')
      expect(result).toBe(undefined)
      expect(dynamicsWebApi.prototype.retrieveGlobalOptionSets).toHaveBeenCalledTimes(1)
    })
    it('returns undefined if the option-set name is not found', async () => {
      const result = await getGlobalOptionSetValue('not-found', 'not-found')
      expect(result).toBe(undefined)
      expect(dynamicsWebApi.prototype.retrieveGlobalOptionSets).toHaveBeenCalledTimes(1)
    })
  })
})
