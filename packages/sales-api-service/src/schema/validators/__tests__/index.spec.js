import TestEntity from '@defra-fish/dynamics-lib/__mocks__/TestEntity.js'
const referenceData = jest.requireActual('../../../services/reference-data.service.js')
const entityManager = jest.requireActual('@defra-fish/dynamics-lib/src/client/entity-manager.js')

describe('validators', () => {
  describe('createOptionSetValidator', () => {
    it('returns a validation function returning undefined when an optionset is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => 'success')
      const validationFunction = require('../index.js').createOptionSetValidator('testOptionSet')
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })

    it('returns a validation function throwing an error when no optionset found', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => null)
      const validationFunction = require('../index.js').createOptionSetValidator('testOptionSet')
      await expect(validationFunction('testValue')).rejects.toThrow('Value provided is not a recognised testOptionSet')
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
})
