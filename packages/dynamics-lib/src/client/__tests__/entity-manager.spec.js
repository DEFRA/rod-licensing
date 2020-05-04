import {
  Contact,
  Permission,
  GlobalOptionSetDefinition,
  persist,
  retrieveMultiple,
  findById,
  findByExample,
  retrieveMultipleAsMap,
  retrieveGlobalOptionSets
} from '../../index.js'
import TestEntity from '../../__mocks__/TestEntity.js'
import { v4 as uuidv4 } from 'uuid'

describe('entity manager', () => {
  describe('persist', () => {
    it('persists a new entity using the create operation', async () => {
      const resultUuid = uuidv4()
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('executeBatch', [resultUuid])
      const createRequestSpy = jest.spyOn(api.prototype, 'createRequest')

      const t = new TestEntity()
      t.strVal = 'Fester'
      t.intVal = 1
      t.boolVal = true

      const result = await persist(t)
      expect(createRequestSpy).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(resultUuid)
    })

    it('persists an existing entity using the update operation', async () => {
      const resultUuid = uuidv4()
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('executeBatch', [resultUuid])
      const updateRequestSpy = jest.spyOn(api.prototype, 'updateRequest')

      const t = TestEntity.fromResponse(
        {
          '@odata.etag': 'W/"202465000"',
          idval: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          strval: 'Fester',
          intval: 1,
          boolval: true
        },
        {}
      )

      const result = await persist(t)
      expect(updateRequestSpy).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(resultUuid)
    })

    it('throws an error object on failure', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__throwWithErrorsOnBatchExecute()
      await expect(persist(new TestEntity())).rejects.toThrow('Test error')
    })

    it('throws an error on implementation failure', async () => {
      await expect(persist(null)).rejects.toThrow("Cannot read property 'toRequestBody' of null")
    })
  })

  describe('retrieveMultiple', () => {
    it('retrieves a single entity type', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('executeBatch', [
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_CONTACT',
              contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
              firstname: 'Fester',
              lastname: 'Tester',
              birthdate: '1946-01-01',
              emailaddress1: 'fester@tester.com'
            }
          ]
        }
      ])

      const result = await retrieveMultiple(Contact).execute()
      expect(result).toHaveLength(1)
      const contact = result[0]
      expect(contact).toBeInstanceOf(Contact)
      expect(contact).toMatchObject(
        expect.objectContaining({
          etag: 'EXAMPLE_CONTACT',
          id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          firstName: 'Fester',
          lastName: 'Tester',
          birthDate: '1946-01-01',
          email: 'fester@tester.com'
        })
      )
    })

    it('retrieves a multiple entity types', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('executeBatch', [
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_CONTACT',
              contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
              firstname: 'Fester',
              lastname: 'Tester',
              birthdate: '1946-01-01',
              emailaddress1: 'fester@tester.com'
            }
          ]
        },
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_PERMISSION',
              defra_permissionid: '347a9083-361e-ea11-a810-000d3a25c5d6',
              defra_name: '00000000-2WC3FDR-CD379B',
              defra_issuedate: '2019-12-13T09:00:00Z',
              defra_startdate: '2019-12-14T00:00:00Z',
              defra_enddate: '2020-12-13T23:59:59Z',
              defra_stagingid: '71ad9a25-2a03-406b-a0e3-f4ff37799374'
            }
          ]
        }
      ])

      const result = await retrieveMultiple(Contact, Permission).execute()
      expect(result).toHaveLength(2)
      const contact = result[0][0]
      expect(contact).toBeInstanceOf(Contact)
      expect(contact).toMatchObject(
        expect.objectContaining({
          etag: 'EXAMPLE_CONTACT',
          id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          firstName: 'Fester',
          lastName: 'Tester',
          birthDate: '1946-01-01',
          email: 'fester@tester.com'
        })
      )

      const permission = result[1][0]
      expect(permission).toBeInstanceOf(Permission)
      expect(permission).toMatchObject(
        expect.objectContaining({
          etag: 'EXAMPLE_PERMISSION',
          id: '347a9083-361e-ea11-a810-000d3a25c5d6',
          referenceNumber: '00000000-2WC3FDR-CD379B',
          issueDate: '2019-12-13T09:00:00Z',
          startDate: '2019-12-14T00:00:00Z',
          endDate: '2020-12-13T23:59:59Z',
          stagingId: '71ad9a25-2a03-406b-a0e3-f4ff37799374'
        })
      )
    })

    it('throws an error object on failure', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__throwWithErrorsOnBatchExecute()
      await expect(retrieveMultiple(TestEntity).execute()).rejects.toThrow('Test error')
    })

    it('throws an error on implementation failure', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__throwWithErrorOn('executeBatch')
      await expect(retrieveMultiple(TestEntity).execute()).rejects.toThrow('Test error')
    })
  })

  describe('retrieveMultipleAsMap', () => {
    it('retrieves a multiple entity types as a map', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('executeBatch', [
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_CONTACT',
              contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
              firstname: 'Fester',
              lastname: 'Tester',
              birthdate: '1946-01-01',
              emailaddress1: 'fester@tester.com'
            }
          ]
        },
        {
          value: [
            {
              '@odata.etag': 'EXAMPLE_PERMISSION',
              defra_permissionid: '347a9083-361e-ea11-a810-000d3a25c5d6',
              defra_name: '00000000-2WC3FDR-CD379B',
              defra_issuedate: '2019-12-13T09:00:00Z',
              defra_startdate: '2019-12-14T00:00:00Z',
              defra_enddate: '2020-12-13T23:59:59Z',
              defra_stagingid: '71ad9a25-2a03-406b-a0e3-f4ff37799374'
            }
          ]
        }
      ])

      const result = await retrieveMultipleAsMap(Contact, Permission).execute()
      expect(result).toMatchObject({
        contacts: expect.arrayContaining([
          expect.objectContaining({
            etag: 'EXAMPLE_CONTACT',
            id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
            firstName: 'Fester',
            lastName: 'Tester',
            birthDate: '1946-01-01',
            email: 'fester@tester.com'
          })
        ]),
        permissions: expect.arrayContaining([
          expect.objectContaining({
            etag: 'EXAMPLE_PERMISSION',
            id: '347a9083-361e-ea11-a810-000d3a25c5d6',
            referenceNumber: '00000000-2WC3FDR-CD379B',
            issueDate: '2019-12-13T09:00:00Z',
            startDate: '2019-12-14T00:00:00Z',
            endDate: '2020-12-13T23:59:59Z',
            stagingId: '71ad9a25-2a03-406b-a0e3-f4ff37799374'
          })
        ])
      })
    })

    it('throws an error object on failure', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__throwWithErrorsOnBatchExecute()
      await expect(retrieveMultipleAsMap(TestEntity).execute()).rejects.toThrow('Test error')
    })

    it('throws an error on implementation failure', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__throwWithErrorOn('executeBatch')
      await expect(retrieveMultipleAsMap(TestEntity).execute()).rejects.toThrow('Test error')
    })
  })

  const optionSetInstance = {
    name: expect.stringMatching(/^[a-z]+_?[a-z]+$/),
    options: expect.objectContaining({
      910400000: expect.objectContaining({
        id: 910400000,
        label: expect.anything(),
        description: expect.anything()
      })
    })
  }

  describe('retrieveGlobalOptionSets', () => {
    it('retrieves a full listing when given no arguments', async () => {
      const result = await retrieveGlobalOptionSets().execute()
      expect(result).toMatchObject({
        defra_concessionproof: expect.objectContaining(optionSetInstance),
        defra_country: expect.objectContaining(optionSetInstance),
        defra_datasource: expect.objectContaining(optionSetInstance),
        defra_datatype: expect.objectContaining(optionSetInstance),
        defra_daymonthyear: expect.objectContaining(optionSetInstance),
        defra_duration: expect.objectContaining(optionSetInstance),
        defra_environmentagencyarea: expect.objectContaining(optionSetInstance),
        defra_financialtransactionsource: expect.objectContaining(optionSetInstance),
        defra_financialtransactiontype: expect.objectContaining(optionSetInstance),
        defra_fulfilmentrequestfilestatus: expect.objectContaining(optionSetInstance),
        defra_fulfilmentrequeststatus: expect.objectContaining(optionSetInstance),
        defra_notificationstatus: expect.objectContaining(optionSetInstance),
        defra_paymenttype: expect.objectContaining(optionSetInstance),
        defra_permitsubtype: expect.objectContaining(optionSetInstance),
        defra_permittype: expect.objectContaining(optionSetInstance),
        defra_poclfiledataerrorstatus: expect.objectContaining(optionSetInstance),
        defra_poclfiledataerrortype: expect.objectContaining(optionSetInstance),
        defra_poclfilestatus: expect.objectContaining(optionSetInstance),
        defra_preferredcontactmethod: expect.objectContaining(optionSetInstance)
      })
    })

    it('retrieves listings for specific names', async () => {
      const result = await retrieveGlobalOptionSets('defra_concessionproof', 'defra_country', 'defra_datasource').execute()
      expect(result).toMatchObject({
        defra_concessionproof: expect.objectContaining(optionSetInstance),
        defra_country: expect.objectContaining(optionSetInstance),
        defra_datasource: expect.objectContaining(optionSetInstance)
      })
      expect(Object.keys(result)).toHaveLength(3)
    })

    it('throws an error object on failure', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__throwWithErrorOn('retrieveGlobalOptionSets')
      await expect(retrieveGlobalOptionSets().execute()).rejects.toThrow('Test error')
    })
  })

  describe('findById', () => {
    it('finds by a primary key guid', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('retrieveRequest', {
        '@odata.etag': 'W/"202465000"',
        idval: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
        strval: 'example'
      })

      const spy = jest.spyOn(api.prototype, 'retrieveRequest')
      const result = await findById(TestEntity, '9f1b34a0-0c66-e611-80dc-c4346bad0190')
      expect(spy).toBeCalledWith({
        key: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select
      })
      expect(result).toBeInstanceOf(TestEntity)
    })

    it('finds by an alternate key', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('retrieveRequest', {
        '@odata.etag': 'W/"202465000"',
        idval: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
        strval: 'example'
      })
      const spy = jest.spyOn(api.prototype, 'retrieveRequest')
      const alternateKeyLookup = `${TestEntity.definition.mappings.strVal.field}='example'`
      const result = await findById(TestEntity, alternateKeyLookup)
      expect(spy).toBeCalledWith({
        key: alternateKeyLookup,
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select
      })

      expect(result).toBeInstanceOf(TestEntity)
    })

    it('returns null if not found', async () => {
      const api = require('dynamics-web-api').default
      const notFoundError = new Error('Not found')
      notFoundError.status = 404

      api.__reset()
      api.__throwWithErrorOn('retrieveRequest', notFoundError)
      const result = await findById(TestEntity, '9f1b34a0-0c66-e611-80dc-c4346bad0190')
      expect(result).toEqual(null)
    })

    it('throws an exception on general errors', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__throwWithErrorOn('retrieveRequest')
      await expect(findById(TestEntity, '9f1b34a0-0c66-e611-80dc-c4346bad0190')).rejects.toThrow('Test error')
    })
  })

  describe('findByExample', () => {
    it('builds a select statement appropriate to the type definition for each field', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('retrieveMultipleRequest', { value: [{}] })

      const lookup = new TestEntity()
      lookup.strVal = 'StringData'
      lookup.intVal = 123
      lookup.decVal = 123.45
      lookup.boolVal = true
      lookup.dateVal = '1946-01-01'
      lookup.dateTimeVal = '1946-01-01T01:02:03Z'
      lookup.optionSetVal = new GlobalOptionSetDefinition('test_globaloption', { id: 910400000, label: 'test', description: 'test' })
      const expectedLookupSelect =
        "strval eq 'StringData' and intval eq 123 and decval eq 123.45 and boolval eq true and dateval eq 1946-01-01 and datetimeval eq 1946-01-01T01:02:03Z and optionsetval eq 910400000"
      const spy = jest.spyOn(api.prototype, 'retrieveMultipleRequest')
      const result = await findByExample(lookup)
      expect(spy).toBeCalledWith({
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select,
        filter: expect.stringMatching(`${TestEntity.definition.defaultFilter} and ${expectedLookupSelect}`)
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(TestEntity)
    })

    it('only serializes fields into the select statement if they are set', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__setResponse('retrieveMultipleRequest', { value: [{}] })

      const lookup = new TestEntity()
      lookup.strVal = 'StringData'
      const expectedLookupSelect = "strval eq 'StringData'"
      const spy = jest.spyOn(api.prototype, 'retrieveMultipleRequest')
      const result = await findByExample(lookup)
      expect(spy).toBeCalledWith({
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select,
        filter: expect.stringMatching(`${TestEntity.definition.defaultFilter} and ${expectedLookupSelect}`)
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(TestEntity)
    })

    it('throws an error object on failure', async () => {
      const api = require('dynamics-web-api').default
      api.__reset()
      api.__throwWithErrorOn('retrieveMultipleRequest')
      await expect(findByExample(new TestEntity())).rejects.toThrow('Test error')
    })
  })
})
