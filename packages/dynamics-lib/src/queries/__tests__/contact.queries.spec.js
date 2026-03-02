import { contactAndPermissionForLicensee, contactForLicenseeNoReference } from '../contact.queries.js'
import { Contact } from '../../entities/contact.entity.js'
import { Permission } from '../../entities/permission.entity.js'
import { PredefinedQuery } from '../predefined-query.js'

jest.mock('dynamics-web-api', () => {
  return jest.fn().mockImplementation(() => {
    return {
      executeUnboundAction: jest.fn()
    }
  })
})

describe('Contact Queries', () => {
  describe('contactForLicenseeNoReference', () => {
    beforeEach(() => {
      jest.resetAllMocks()

      jest.spyOn(Contact.definition, 'mappings', 'get').mockReturnValue({
        postcode: { field: 'mock_postcode' },
        birthDate: { field: 'mock_birthdate' }
      })

      jest.spyOn(Contact.definition, 'defaultFilter', 'get').mockReturnValue('statecode eq 0')
    })

    it('should return a predefined query', () => {
      const result = contactForLicenseeNoReference('03/12/1990', 'AB12 3CD')
      expect(result).toBeInstanceOf(PredefinedQuery)
    })

    it('root should return Contact', () => {
      const result = contactForLicenseeNoReference('03/12/1990', 'AB12 3CD')
      expect(result._root).toEqual(Contact)
    })

    it('should use mocked values for mapping postcode and birth date', () => {
      const result = contactForLicenseeNoReference('03/12/1990', 'AB12 3CD')
      expect(result._retrieveRequest.filter).toEqual(
        expect.stringContaining(Contact.definition.mappings.postcode.field),
        expect.stringContaining(Contact.definition.mappings.birthDate.field)
      )
    })

    it.each([
      ['AB12 3CD', '03/12/1990'],
      ['EF45 6GH', '05/06/1987'],
      ['IJ78 9KL', '14/11/1975']
    ])('should return correct retrieve request when postcode is %s and birth date is %s', (postcode, birthDate) => {
      const result = contactForLicenseeNoReference(birthDate, postcode)

      expect(result._retrieveRequest).toEqual({
        collection: 'contacts',
        expand: [],
        filter: `mock_postcode eq '${postcode}' and mock_birthdate eq ${birthDate} and statecode eq 0`,
        select: expect.any(Array)
      })
    })
  })

  describe('contactAndPermissionForLicensee', () => {
    beforeEach(() => {
      jest.resetAllMocks()

      jest.spyOn(Contact.definition, 'mappings', 'get').mockReturnValue({
        id: { field: 'mock_contactid' },
        postcode: { field: 'mock_postcode' }
      })

      jest.spyOn(Permission.definition, 'mappings', 'get').mockReturnValue({
        referenceNumber: { field: 'mock_reference' },
        issueDate: { field: 'mock_issueDate' }
      })

      jest.spyOn(Permission.definition, 'defaultFilter', 'get').mockReturnValue('statecode eq 0')

      jest.spyOn(Permission.definition, 'relationships', 'get').mockReturnValue({
        licensee: { property: 'mock_licensee' }
      })
    })

    it('should return a predefined query', () => {
      const result = contactAndPermissionForLicensee('ABC123', 'AB12 3CD')
      expect(result).toBeInstanceOf(PredefinedQuery)
    })

    it('root should return Permission', () => {
      const result = contactAndPermissionForLicensee('ABC123', 'AB12 3CD')
      expect(result._root).toEqual(Permission)
    })

    it('should build correct filter', () => {
      const result = contactAndPermissionForLicensee('ABC123', 'AB12 3CD')

      expect(result._retrieveRequest.filter).toEqual(
        "endswith(mock_reference, 'ABC123') and statecode eq 0 and mock_licensee/mock_postcode eq 'AB12 3CD'"
      )
    })

    it('should build correct orderBy', () => {
      const result = contactAndPermissionForLicensee('ABC123', 'AB12 3CD')

      expect(result._retrieveRequest.orderBy).toEqual(['mock_issueDate desc', 'mock_licensee/mock_contactid asc'])
    })

    it('should set expand correctly', () => {
      const result = contactAndPermissionForLicensee('ABC123', 'AB12 3CD')

      expect(result._retrieveRequest.expand).toEqual([
        {
          property: 'mock_licensee',
          select: ['mock_contactid', 'mock_postcode']
        }
      ])
    })

    it.each([
      ['XYZ999', 'EF45 6GH'],
      ['123ABC', 'IJ78 9KL'],
      ['AAAAAA', 'ZZ99 9ZZ']
    ])(
      'should return correct retrieve request when the last 6 characters of the permission is %s and postcode is %s',
      (permissionLast6, postcode) => {
        const result = contactAndPermissionForLicensee(permissionLast6, postcode)

        expect(result._retrieveRequest).toEqual({
          collection: 'defra_permissions',
          filter: `endswith(mock_reference, '${permissionLast6}') and statecode eq 0 and mock_licensee/mock_postcode eq '${postcode}'`,
          orderBy: ['mock_issueDate desc', 'mock_licensee/mock_contactid asc'],
          expand: [
            {
              property: 'mock_licensee',
              select: ['mock_contactid', 'mock_postcode']
            }
          ],
          select: [
            'defra_permissionid',
            'defra_name',
            'defra_issuedate',
            'defra_startdate',
            'defra_enddate',
            'defra_stagingid',
            'defra_datasource',
            'defra_renewal',
            'defra_rcpagreement',
            'defra_licenceforyou'
          ]
        })
      }
    )
  })
})
