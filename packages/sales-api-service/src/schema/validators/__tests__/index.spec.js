import TestEntity from '@defra-fish/dynamics-lib/__mocks__/TestEntity.js'
import { PermitConcession } from '@defra-fish/dynamics-lib'
const referenceData = jest.requireActual('../../../services/reference-data.service.js')
const entityManager = jest.requireActual('@defra-fish/dynamics-lib/src/client/entity-manager.js')

describe('validators', () => {
  describe('createOptionSetValidator', () => {
    it('returns a validation function returning undefined when an optionset is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => 'success')
      const schema = require('../index.js').createOptionSetValidator('testOptionSet', 'Test Example')
      await expect(schema.validateAsync('testValue')).resolves.toEqual('testValue')
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })

    it('returns a validation function throwing an error when no optionset found', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => null)
      const schema = require('../index.js').createOptionSetValidator('testOptionSet', 'Test Example')
      await expect(schema.validateAsync('testValue')).rejects.toThrow('Value provided is not a recognised testOptionSet')
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })
  })

  describe('createReferenceDataEntityValidator', () => {
    it('returns a validation function returning undefined when a cached reference data entity is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntityAndId').mockImplementation(async () => 'success')
      const validationFunction = require('../index.js').createReferenceDataEntityValidator(TestEntity)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when no reference data entity found', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntityAndId').mockImplementation(async () => null)
      const validationFunction = require('../index.js').createReferenceDataEntityValidator(TestEntity)
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised test identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })
  })

  describe('createEntityIdValidator', () => {
    it('returns a validation function returning undefined when an entity is successfully resolved', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = require('../index.js').createEntityIdValidator(TestEntity)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function returning undefined when an entity is not resolved and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = require('../index.js').createEntityIdValidator(TestEntity, true)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when no entity is found', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = require('../index.js').createEntityIdValidator(TestEntity)
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised test identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when an entity is found and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = require('../index.js').createEntityIdValidator(TestEntity, true)
      await expect(validationFunction('testValue')).rejects.toThrow('Entity for test identifier already exists')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })
  })

  describe('createAlternateKeyValidator', () => {
    it('returns a validation function returning undefined when an entity is successfully resolved', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = require('../index.js').createAlternateKeyValidator(TestEntity, 'strval')
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, "strval='testValue'")
    })

    it('returns a validation function returning undefined when an entity is not resolved and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = require('../index.js').createAlternateKeyValidator(TestEntity, 'strval', true)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, "strval='testValue'")
    })

    it('returns a validation function throwing an error when no entity is found', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = require('../index.js').createAlternateKeyValidator(TestEntity, 'strval')
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised test identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, "strval='testValue'")
    })

    it('returns a validation function throwing an error when an entity is found and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = require('../index.js').createAlternateKeyValidator(TestEntity, 'strval', true)
      await expect(validationFunction('testValue')).rejects.toThrow('Entity for test identifier already exists')
      expect(spy).toHaveBeenCalledWith(TestEntity, "strval='testValue'")
    })
  })

  describe('createPermitConcessionValidator', () => {
    it('returns a validation function returning undefined when the permit and concession are successfully resolved', async () => {
      const spy = jest
        .spyOn(referenceData, 'getReferenceDataForEntity')
        .mockImplementation(async () => [{ permitId: 'test-1', concessionId: 'test-1' }])
      const validationFunction = require('../index.js').createPermitConcessionValidator()
      await expect(
        validationFunction({
          permitId: 'test-1',
          concession: {
            concessionId: 'test-1'
          }
        })
      ).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(PermitConcession)
    })
  })
  it('returns a validation function throwing an error if the permit and concession are not successfully resolved', async () => {
    const spy = jest
      .spyOn(referenceData, 'getReferenceDataForEntity')
      .mockImplementation(async () => [{ permitId: 'test-1', concessionId: 'test-1' }])
    const validationFunction = require('../index.js').createPermitConcessionValidator()
    await expect(
      validationFunction({
        permitId: 'test-1',
        concession: {
          concessionId: 'test-2'
        }
      })
    ).rejects.toThrow("The concession 'test-2' is not valid with respect to the permit 'test-1'")
    expect(spy).toHaveBeenCalledWith(PermitConcession)
  })
  it('returns a validation function throwing an error if the permit requires a concession and none is supplied', async () => {
    const spy = jest
      .spyOn(referenceData, 'getReferenceDataForEntity')
      .mockImplementation(async () => [{ permitId: 'test-1', concessionId: 'test-1' }])
    const validationFunction = require('../index.js').createPermitConcessionValidator()
    await expect(
      validationFunction({
        permitId: 'test-1'
      })
    ).rejects.toThrow("The concession 'undefined' is not valid with respect to the permit 'test-1'")
    expect(spy).toHaveBeenCalledWith(PermitConcession)
  })
})
