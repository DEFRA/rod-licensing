import { contactAndPermissionForLicensee, contactForLicenseeNoReference, contactForLicenseeByPersonalDetails } from '../contact.queries.js'
import { Contact } from '../../entities/contact.entity.js'
import { Permission } from '../../entities/permission.entity.js'
import { PredefinedQuery } from '../predefined-query.js'

jest.mock('dynamics-web-api', () => {
  return {
    DynamicsWebApi: jest.fn().mockImplementation(() => {
      return {
        callAction: jest.fn()
      }
    })
  }
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

  describe('contactForLicenseeByPersonalDetails', () => {
    beforeEach(() => {
      jest.resetAllMocks()

      jest.spyOn(Contact.definition, 'mappings', 'get').mockReturnValue({
        firstName: { field: 'mock_firstname' },
        lastName: { field: 'mock_lastname' },
        postcode: { field: 'mock_postcode' },
        birthDate: { field: 'mock_birthdate' }
      })

      jest.spyOn(Contact.definition, 'defaultFilter', 'get').mockReturnValue('statecode eq 0')
    })

    it('should return a predefined query', () => {
      const result = contactForLicenseeByPersonalDetails('Bilbo', 'Baggins', '2000-10-03', 'AB12 3CD')
      expect(result).toBeInstanceOf(PredefinedQuery)
    })

    it('root should return Contact', () => {
      const result = contactForLicenseeByPersonalDetails('Frodo', 'Baggins', '2003-10-03', 'AB12 3CD')
      expect(result._root).toEqual(Contact)
    })

    it.each([
      ['Bilbo', 'Baggins', '2000-10-03', 'AB12 3CD'],
      ['Frodo', 'Baggins', '1980-09-22', 'EF45 6GH'],
      ['Samwise', 'Gamgee', '1985-03-06', 'IJ78 9KL']
    ])(
      'should return correct retrieve request when first name is %s, last name is %s, birth date is %s and postcode is %s',
      (firstName, lastName, birthDate, postcode) => {
        const result = contactForLicenseeByPersonalDetails(firstName, lastName, birthDate, postcode)

        expect(result._retrieveRequest).toEqual({
          collection: 'contacts',
          expand: [],
          filter: `mock_firstname eq '${firstName}' and mock_lastname eq '${lastName}' and mock_postcode eq '${postcode}' and mock_birthdate eq ${birthDate} and statecode eq 0`,
          select: expect.any(Array)
        })
      }
    )
  })

  describe('contactAndPermissionForLicensee', () => {
    beforeEach(() => {
      jest.resetAllMocks()

      jest.spyOn(Contact.definition, 'mappings', 'get').mockReturnValue({
        id: { field: 'contactid' },
        postcode: { field: 'defra_postcode' }
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
        "endswith(defra_name, 'ABC123') and statecode eq 0 and defra_ContactId/defra_postcode eq 'AB12 3CD'"
      )
    })

    it('should build correct orderBy', () => {
      const result = contactAndPermissionForLicensee('ABC123', 'AB12 3CD')

      expect(result._retrieveRequest.orderBy).toEqual(['defra_issuedate desc', 'defra_ContactId/contactid asc'])
    })

    it('should set expand correctly', () => {
      const result = contactAndPermissionForLicensee('ABC123', 'AB12 3CD')

      expect(result._retrieveRequest.expand).toEqual([
        {
          property: 'defra_ContactId',
          select: ['contactid', 'defra_postcode']
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
          filter: `endswith(defra_name, '${permissionLast6}') and statecode eq 0 and defra_ContactId/defra_postcode eq '${postcode}'`,
          orderBy: ['defra_issuedate desc', 'defra_ContactId/contactid asc'],
          expand: [
            {
              property: 'defra_ContactId',
              select: ['contactid', 'defra_postcode']
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
