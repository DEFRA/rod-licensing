import { Contact, Permission, persist, retrieveMultiple, findByExample, retrieveMultipleAsMap } from '../../index.js'
import uuid from 'uuid/v4'

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

      const c = Contact.fromResponse({
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
        defra_country: 910400195,
        defra_preferredmethodofcontact: 910400001,
        defra_gdprmarketingpreferenceoptin: false
      })

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

      const result = await retrieveMultiple(Contact)
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
              defra_stagingid: '71ad9a25-2a03-406b-a0e3-f4ff37799374',
              defra_datasource: 910400003
            }
          ]
        }
      ])

      const result = await retrieveMultiple(Contact, Permission)
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
          stagingId: '71ad9a25-2a03-406b-a0e3-f4ff37799374',
          dataSource: 910400003
        })
      )
    })
  })

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
            defra_stagingid: '71ad9a25-2a03-406b-a0e3-f4ff37799374',
            defra_datasource: 910400003
          }
        ]
      }
    ])

    const result = await retrieveMultipleAsMap(Contact, Permission)
    expect(result).toMatchObject({
      Contact: expect.arrayContaining([
        expect.objectContaining({
          etag: 'EXAMPLE_CONTACT',
          id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
          firstName: 'Fester',
          lastName: 'Tester',
          birthDate: '1946-01-01',
          email: 'fester@tester.com'
        })
      ]),
      Permission: expect.arrayContaining([
        expect.objectContaining({
          etag: 'EXAMPLE_PERMISSION',
          id: '347a9083-361e-ea11-a810-000d3a25c5d6',
          referenceNumber: '00000000-2WC3FDR-CD379B',
          issueDate: '2019-12-13T09:00:00Z',
          startDate: '2019-12-14T00:00:00Z',
          endDate: '2020-12-13T23:59:59Z',
          stagingId: '71ad9a25-2a03-406b-a0e3-f4ff37799374',
          dataSource: 910400003
        })
      ])
    })
  })
})

describe('findByExample', () => {
  it('retrieves a single entity', async () => {
    const api = require('dynamics-web-api').default
    api.__setResponse({
      value: [
        {
          '@odata.etag': 'EXAMPLE',
          firstname: 'Some',
          lastname: 'Person'
        }
      ]
    })

    const lookup = new Contact()
    lookup.firstName = 'Some'
    lookup.lastName = 'Person'

    const spy = jest.spyOn(api.prototype, 'retrieveMultipleRequest')
    const result = await findByExample(lookup)
    expect(spy).toBeCalledWith(
      expect.objectContaining({
        collection: expect.stringMatching(Contact.definition.collection),
        select: Contact.definition.select,
        filter: expect.stringMatching(Contact.definition.defaultFilter + " and firstname eq 'Some' and lastname eq 'Person'"),
        includeAnnotations: expect.stringMatching('OData.Community.Display.V1.FormattedValue')
      })
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(Contact)
    expect(result[0].etag).toEqual('EXAMPLE')
    expect(result[0].firstName).toEqual('Some')
    expect(result[0].lastName).toEqual('Person')
  })
})
