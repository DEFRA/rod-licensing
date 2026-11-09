import { contactAndPermissionForLicensee, contactForLicenseeNoReference, contactForLicenseeByPersonalDetails } from '../contact.queries.js'
import { Contact } from '../../entities/contact.entity.js'
import { Permission } from '../../entities/permission.entity.js'
import { PredefinedQuery } from '../predefined-query.js'
import { escapeODataStringValue } from '../../client/util.js'

jest.mock('dynamics-web-api', () => {
  return {
    DynamicsWebApi: jest.fn().mockImplementation(() => {
      return {
        callAction: jest.fn()
      }
    })
  }
})

jest.mock('../../client/util.js', () => ({
  escapeODataStringValue: jest.fn(value => value)
}))

describe('Contact Queries', () => {
  describe('contactForLicenseeNoReference', () => {
    beforeEach(() => {
      const defaultFilter = 'statecode eq 77'

      jest.spyOn(Contact.definition, 'mappings', 'get').mockReturnValue({
        postcode: { field: 'mock_postcode' },
        birthDate: { field: 'mock_birthdate' }
      })

      jest.spyOn(Contact.definition, 'defaultFilter', 'get').mockReturnValue(defaultFilter)
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
        filter: `mock_postcode eq '${postcode}' and mock_birthdate eq ${birthDate} and ${Contact.definition.defaultFilter}`,
        select: expect.any(Array)
      })
    })
  })

  describe('contactAndPermissionForLicensee', () => {
    beforeEach(() => {
      const defaultFilter = 'statecode eq 77'

      jest.spyOn(Contact.definition, 'mappings', 'get').mockReturnValue({
        id: { field: 'contactid' },
        postcode: { field: 'defra_postcode' }
      })
      jest.spyOn(Permission.definition, 'defaultFilter', 'get').mockReturnValue(defaultFilter)
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
        `endswith(defra_name, 'ABC123') and ${Permission.definition.defaultFilter} and defra_ContactId/defra_postcode eq 'AB12 3CD'`
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
          filter: `endswith(defra_name, '${permissionLast6}') and ${Permission.definition.defaultFilter} and defra_ContactId/defra_postcode eq '${postcode}'`,
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

describe('contactForLicenseeByPersonalDetails', () => {
  beforeEach(() => {
    const defaultFilter = 'statecode eq 77'

    jest.spyOn(Contact.definition, 'mappings', 'get').mockReturnValue({
      firstName: { field: 'mock_firstname' },
      lastName: { field: 'mock_lastname' },
      premises: { field: 'mock_premises' },
      postcode: { field: 'mock_postcode' },
      birthDate: { field: 'mock_birthdate' }
    })

    jest.spyOn(Contact.definition, 'defaultFilter', 'get').mockReturnValue(defaultFilter)
  })

  it.each([
    { details: { licenseeFirstName: 'Brenin' }, testfield: 'first name', fieldName: 'licenseeFirstName' },
    { details: { licenseeLastName: 'Pysgotwr' }, testfield: 'last name', fieldName: 'licenseeLastName' },
    { details: { licenseePremises: 'Dunmanifestin' }, testfield: 'premises', fieldName: 'licenseePremises' },
    { details: { licenseePostcode: 'GZ1 1UH' }, testfield: 'post code', fieldName: 'licenseePostcode' }
  ])('escapes value of $testfield', ({ testfield: _t, details, fieldName }) => {
    for (let x = 0; x < 4; x++) {
      escapeODataStringValue.mockImplementationOnce(value => `!@£${value}$%%`)
    }
    const query = contactForLicenseeByPersonalDetails({
      licenseeFirstName: 'firstName',
      licenseeLastName: 'lastName',
      licenseePremises: '15',
      licenseePostcode: 'AB1 1AB',
      licenseeBirthDate: '2000-01-01',
      ...details
    })

    expect(query._retrieveRequest.filter).toEqual(expect.stringContaining(`!@£${details[fieldName]}$%%`))
  })

  it.each([
    ['Smeagol', 'Ring', '2000-10-03', '12', 'AB12 3CD'],
    ['Frodo', 'Baggins', '1993-09-22', 'Dunmanifestin', 'EF45 6GH'],
    ['Samwise', 'Gamgee', '1998-03-06', '1507', 'IJ78 9KL']
  ])(
    'should return correct retrieve request when first name is %s, last name is %s, birth date is %s, premises is %s and postcode is %s',
    (licenseeFirstName, licenseeLastName, licenseeBirthDate, licenseePremises, licenseePostcode) => {
      const result = contactForLicenseeByPersonalDetails({
        licenseeFirstName,
        licenseeLastName,
        licenseeBirthDate,
        licenseePremises,
        licenseePostcode
      })

      expect(result._retrieveRequest).toEqual({
        collection: 'contacts',
        expand: [],
        filter: `mock_firstname eq '${licenseeFirstName}' and mock_lastname eq '${licenseeLastName}' and mock_premises eq '${licenseePremises}' and mock_postcode eq '${licenseePostcode}' and mock_birthdate eq ${licenseeBirthDate} and ${Contact.definition.defaultFilter}`,
        select: expect.any(Array)
      })
    }
  )

  it('should return a predefined query', () => {
    const result = contactForLicenseeByPersonalDetails({
      licenseeFirstName: 'Gandalf',
      licenseeLastName: 'Grey',
      licenseeBirthDate: '1960-10-03',
      licenseePostcode: 'AB12 3CD'
    })
    expect(result).toBeInstanceOf(PredefinedQuery)
  })

  it('root should return Contact', () => {
    const result = contactForLicenseeByPersonalDetails({
      licenseeFirstName: 'Aragorn',
      licenseeLastName: 'Elessar',
      licenseeBirthDate: '1989-04-20',
      licenseePostcode: 'AB12 3CD'
    })
    expect(result._root).toEqual(Contact)
  })
})
