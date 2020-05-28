import TestEntity from '@defra-fish/dynamics-lib/src/__mocks__/TestEntity.js'
import { PermitConcession } from '@defra-fish/dynamics-lib'
const referenceData = jest.requireActual('../../../services/reference-data.service.js')
const entityManager = jest.requireActual('@defra-fish/dynamics-lib/src/client/entity-manager.js')

describe('validators', () => {
  beforeEach(jest.resetAllMocks)

  describe('buildJoiOptionSetValidator', () => {
    it('returns a Joi validator returning undefined when an optionset is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => 'success')
      const schema = require('../validators.js').buildJoiOptionSetValidator('testOptionSet', 'Test Example')
      await expect(schema.validateAsync('testValue')).resolves.toEqual('testValue')
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })

    it('returns a Joi validator that requires a value to be present', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue')
      const schema = require('../validators.js').buildJoiOptionSetValidator('testOptionSet', 'Test Example')
      await expect(schema.validateAsync(undefined)).rejects.toThrow('"value" is required')
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a Joi validator throwing an error when no optionset found', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => null)
      const schema = require('../validators.js').buildJoiOptionSetValidator('testOptionSet', 'Test Example')
      await expect(schema.validateAsync('testValue')).rejects.toThrow('Value provided is not a recognised testOptionSet')
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })
  })

  describe('createOptionSetValidator', () => {
    it('returns a validation function returning undefined when an optionset is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => 'success')
      const validationFunction = require('../validators.js').createOptionSetValidator('testOptionSet')
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => 'success')
      const validationFunction = require('../validators.js').createOptionSetValidator('testOptionSet')
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function throwing an error when no optionset found', async () => {
      const spy = jest.spyOn(referenceData, 'getGlobalOptionSetValue').mockImplementation(async () => null)
      const validationFunction = require('../validators.js').createOptionSetValidator('testOptionSet')
      await expect(validationFunction('testValue')).rejects.toThrow('Value provided is not a recognised testOptionSet')
      expect(spy).toHaveBeenCalledWith('testOptionSet', 'testValue')
    })
  })

  describe('createReferenceDataEntityValidator', () => {
    it('returns a validation function returning undefined when a cached reference data entity is successfully resolved', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntityAndId').mockImplementation(async () => 'success')
      const validationFunction = require('../validators.js').createReferenceDataEntityValidator(TestEntity)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntityAndId')
      const validationFunction = require('../validators.js').createReferenceDataEntityValidator(TestEntity)
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function throwing an error when no reference data entity found', async () => {
      const spy = jest.spyOn(referenceData, 'getReferenceDataForEntityAndId').mockImplementation(async () => null)
      const validationFunction = require('../validators.js').createReferenceDataEntityValidator(TestEntity)
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised test identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })
  })

  describe('createEntityIdValidator', () => {
    it('returns a validation function returning undefined when an entity is successfully resolved', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = require('../validators.js').createEntityIdValidator(TestEntity)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(entityManager, 'findById')
      const validationFunction = require('../validators.js').createEntityIdValidator(TestEntity, true)
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function returning undefined when an entity is not resolved and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = require('../validators.js').createEntityIdValidator(TestEntity, true)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when no entity is found', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = require('../validators.js').createEntityIdValidator(TestEntity)
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised test identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })

    it('returns a validation function throwing an error when an entity is found and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = require('../validators.js').createEntityIdValidator(TestEntity, true)
      await expect(validationFunction('testValue')).rejects.toThrow('Entity for test identifier already exists')
      expect(spy).toHaveBeenCalledWith(TestEntity, 'testValue')
    })
  })

  describe('createAlternateKeyValidator', () => {
    it('returns a validation function returning undefined when an entity is successfully resolved', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = require('../validators.js').createAlternateKeyValidator(TestEntity, 'strval')
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, "strval='testValue'")
    })

    it('returns a validation function which skips validation if the input value is undefined', async () => {
      const spy = jest.spyOn(entityManager, 'findById')
      const validationFunction = require('../validators.js').createAlternateKeyValidator(TestEntity, 'strval', true)
      await expect(validationFunction(undefined)).resolves.toEqual(undefined)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns a validation function returning undefined when an entity is not resolved and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = require('../validators.js').createAlternateKeyValidator(TestEntity, 'strval', true)
      await expect(validationFunction('testValue')).resolves.toEqual(undefined)
      expect(spy).toHaveBeenCalledWith(TestEntity, "strval='testValue'")
    })

    it('returns a validation function throwing an error when no entity is found', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => null)
      const validationFunction = require('../validators.js').createAlternateKeyValidator(TestEntity, 'strval')
      await expect(validationFunction('testValue')).rejects.toThrow('Unrecognised test identifier')
      expect(spy).toHaveBeenCalledWith(TestEntity, "strval='testValue'")
    })

    it('returns a validation function throwing an error when an entity is found and negate is set', async () => {
      const spy = jest.spyOn(entityManager, 'findById').mockImplementation(async () => 'success')
      const validationFunction = require('../validators.js').createAlternateKeyValidator(TestEntity, 'strval', true)
      await expect(validationFunction('testValue')).rejects.toThrow('Entity for test identifier already exists')
      expect(spy).toHaveBeenCalledWith(TestEntity, "strval='testValue'")
    })
  })

  describe('createPermitConcessionValidator', () => {
    it('returns a validation function returning undefined when the permit and concession are successfully resolved', async () => {
      const spy = jest
        .spyOn(referenceData, 'getReferenceDataForEntity')
        .mockImplementation(async () => [{ permitId: 'test-1', concessionId: 'test-1' }])
      const validationFunction = require('../validators.js').createPermitConcessionValidator()
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
    const validationFunction = require('../validators.js').createPermitConcessionValidator()
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

  it('returns a validation function which skips validation if the input value is undefined', async () => {
    const spy = jest
      .spyOn(referenceData, 'getReferenceDataForEntity')
      .mockImplementation(async () => [{ permitId: 'test-1', concessionId: 'test-1' }])
    const validationFunction = require('../validators.js').createPermitConcessionValidator()
    await expect(validationFunction()).resolves.toEqual(undefined)
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns a validation function throwing an error if the permit requires a concession and none is supplied', async () => {
    const spy = jest
      .spyOn(referenceData, 'getReferenceDataForEntity')
      .mockImplementation(async () => [{ permitId: 'test-1', concessionId: 'test-1' }])
    const validationFunction = require('../validators.js').createPermitConcessionValidator()
    await expect(
      validationFunction({
        permitId: 'test-1'
      })
    ).rejects.toThrow("The concession 'undefined' is not valid with respect to the permit 'test-1'")
    expect(spy).toHaveBeenCalledWith(PermitConcession)
  })
})
