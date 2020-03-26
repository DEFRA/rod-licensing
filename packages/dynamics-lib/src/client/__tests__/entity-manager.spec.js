import {
  Contact,
  Permission,
  GlobalOptionSetDefinition,
  persist,
  retrieveMultiple,
  findByExample,
  retrieveMultipleAsMap,
  retrieveGlobalOptionSets
} from '../../index.js'
import TestEntity from '../../../__mocks__/TestEntity.js'
import uuid from 'uuid/v4.js'

describe('entity manager', () => {
  describe('persist', () => {
    it('persists a new entity using the create operation', async () => {
      const resultUuid = uuid()
      const api = require('dynamics-web-api').default
      api.__setResponse([resultUuid])
      const createRequestSpy = jest.spyOn(api.prototype, 'createRequest')

      const c = new Contact()
      c.firstName = 'Fester'
      c.lastName = 'Tester'
      c.email = 'fester@thetester.com'

      const result = await persist(c)
      expect(createRequestSpy).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(resultUuid)
    })

    it('persists an existing entity using the update operation', async () => {
      const resultUuid = uuid()
      const api = require('dynamics-web-api').default
      api.__setResponse([resultUuid])
      const updateRequestSpy = jest.spyOn(api.prototype, 'updateRequest')

      const c = Contact.fromResponse(
        {
          '@odata.etag': 'W/"202465000"',
          contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          firstname: 'Fester',
          lastname: 'Tester',
          birthdate: '1946-01-01',
          emailaddress1: 'fester@tester.com',
          mobilephone: '01234 567890',
          defra_premises: '1',
          defra_street: 'Tester Avenue',
          defra_locality: 'Testville',
          defra_town: 'Tersterton',
          defra_postcode: 'AB12 3CD',
          defra_gdprmarketingpreferenceoptin: false
        },
        {}
      )

      const result = await persist(c)
      expect(updateRequestSpy).toHaveBeenCalled()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(resultUuid)
    })
  })

  describe('retrieveMultiple', () => {
    it('retrieves a single entity type', async () => {
      const api = require('dynamics-web-api').default
      api.__setResponse([
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
      api.__setResponse([
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
  })
})

describe('retrieveMultipleAsMap', () => {
  it('retrieves a multiple entity types as a map', async () => {
    const api = require('dynamics-web-api').default
    api.__setResponse([
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
})

describe('findByExample', () => {
  it('builds a select statement appropriate to the type definition for each field', async () => {
    const api = require('dynamics-web-api').default
    api.__setResponse({ value: [{}] })

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
    expect(spy).toBeCalledWith(
      expect.objectContaining({
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select,
        filter: expect.stringMatching(`${TestEntity.definition.defaultFilter} and ${expectedLookupSelect}`)
      })
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(TestEntity)
  })

  it('only serializes fields into the select statement if they are set', async () => {
    const api = require('dynamics-web-api').default
    api.__setResponse({ value: [{}] })

    const lookup = new TestEntity()
    lookup.strVal = 'StringData'
    const expectedLookupSelect = "strval eq 'StringData'"
    const spy = jest.spyOn(api.prototype, 'retrieveMultipleRequest')
    const result = await findByExample(lookup)
    expect(spy).toBeCalledWith(
      expect.objectContaining({
        collection: TestEntity.definition.dynamicsCollection,
        select: TestEntity.definition.select,
        filter: expect.stringMatching(`${TestEntity.definition.defaultFilter} and ${expectedLookupSelect}`)
      })
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(TestEntity)
  })
})
