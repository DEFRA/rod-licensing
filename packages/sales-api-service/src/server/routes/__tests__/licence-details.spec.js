import moment from 'moment'
import { contactForLicenseeByPersonalDetails, executeQuery, permissionForContacts, Permission } from '@defra-fish/dynamics-lib'
import route, { getLicenceDetails } from '../licence-details.js'
import {
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_8DAY_SENIOR_PERMIT_ENTITY,
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_12MONTH_DISABLED_PERMIT,
  MOCK_12MONTH_JUNIOR_PERMIT,
  MOCK_12MONTH_FULL_PERMIT
} from '../../../__mocks__/test-data.js'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  contactForLicenseeByPersonalDetails: jest.fn(),
  executeQuery: jest.fn(),
  permissionForContacts: jest.fn()
}))

describe('licence-details handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    contactForLicenseeByPersonalDetails.mockReturnValue({ filter: 'mock-contact-filter' })
    permissionForContacts.mockImplementation(contactIds => ({ filter: `contactIds eq ${contactIds.join(',')}` }))
  })

  const baseRequest = {
    query: {
      licenseeFirstName: 'Bilbo',
      licenseeLastName: 'Baggins',
      licenseeBirthDate: '2000-10-03',
      licenseePostcode: 'AB12 3CD'
    }
  }

  const mockContact = () => ({ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} })

  const addDays = days => moment().add(days, 'days').toISOString()

  const mockPermission = ({ permit = MOCK_12MONTH_SENIOR_PERMIT, startDate = addDays(-30), endDate = addDays(30) } = {}) => ({
    entity: Object.assign(new Permission(), MOCK_EXISTING_PERMISSION_ENTITY, { startDate, endDate }),
    expanded: {
      licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
      permit: { entity: permit, expanded: {} }
    }
  })

  const expectNotFoundError = promise =>
    expect(promise).rejects.toMatchObject({
      output: {
        statusCode: 404,
        payload: {
          error: 'Not Found',
          message: 'Licence details could not be found for the provided contact details',
          statusCode: 404
        }
      }
    })

  const mockContactWithPermissions = (...permissions) => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce(permissions)
  }

  it('registers the expected route metadata', () => {
    const routeMetadata = {
      method: route[0].method,
      path: route[0].path,
      description: route[0].options.description,
      notes: route[0].options.notes.trim(),
      tags: route[0].options.tags
    }

    expect(routeMetadata).toMatchInlineSnapshot(`
      Object {
        "description": "Look up licence details for a licensee using their name, postcode and date of birth",
        "method": "GET",
        "notes": "Look up licence details for a licensee using their name, postcode and date of birth",
        "path": "/licenceDetails",
        "tags": Array [
          "api",
          "licence-details",
        ],
      }
    `)
  })

  it('returns 500 if executeQuery throws', async () => {
    executeQuery.mockRejectedValueOnce(new Error('some error'))

    await expect(getLicenceDetails(baseRequest)).rejects.toThrow('some error')
  })

  it('calls contactForLicenseeByPersonalDetails with the name, dob and postcode from the query', async () => {
    mockContactWithPermissions(mockPermission())

    await getLicenceDetails(baseRequest)

    expect(contactForLicenseeByPersonalDetails).toHaveBeenCalledWith({
      licenseeFirstName: 'Bilbo',
      licenseeLastName: 'Baggins',
      licenseeBirthDate: '2000-10-03',
      licenseePostcode: 'AB12 3CD'
    })
  })

  it('throws a not found error if no contacts match the provided details', async () => {
    executeQuery.mockResolvedValueOnce([])

    await expectNotFoundError(getLicenceDetails(baseRequest))
  })

  it('does not call permissionForContacts if no contacts match the provided details', async () => {
    executeQuery.mockResolvedValueOnce([])

    await expect(getLicenceDetails(baseRequest)).rejects.toThrow()
    expect(permissionForContacts).not.toHaveBeenCalled()
  })

  it('calls permissionForContacts with contact ids from contactForLicenseeByPersonalDetails', async () => {
    mockContactWithPermissions(mockPermission())

    await getLicenceDetails(baseRequest)

    expect(permissionForContacts).toHaveBeenCalledWith([MOCK_EXISTING_CONTACT_ENTITY.id])
  })

  it('throws a not found error if no permissions are found for the matching contacts', async () => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce([])

    await expectNotFoundError(getLicenceDetails(baseRequest))
  })

  it('returns licence details matching the expected shape', async () => {
    const permission = mockPermission()
    mockContactWithPermissions(permission)

    await expect(getLicenceDetails(baseRequest)).resolves.toMatchObject({
      licences: [
        expect.objectContaining({
          ...permission.entity.toJSON(),
          licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
          permit: MOCK_12MONTH_SENIOR_PERMIT.toJSON()
        })
      ]
    })
  })

  it('returns multiple licences when more than one permission matches', async () => {
    mockContactWithPermissions(mockPermission(), mockPermission())

    const result = await getLicenceDetails(baseRequest)

    expect(result).toMatchObject({
      licences: expect.arrayContaining([expect.any(Object), expect.any(Object)])
    })
  })

  it('returns 2 licences when more than one permission matches', async () => {
    mockContactWithPermissions(mockPermission(), mockPermission())

    const result = await getLicenceDetails(baseRequest)

    expect(result.licences).toHaveLength(2)
  })

  it.each([
    ['1-day', MOCK_1DAY_SENIOR_PERMIT_ENTITY],
    ['8-day', MOCK_8DAY_SENIOR_PERMIT_ENTITY]
  ])('excludes %s permits from the response', async (_, permit) => {
    mockContactWithPermissions(mockPermission({ permit }))

    await expectNotFoundError(getLicenceDetails(baseRequest))
  })

  it('excludes expired licences from the response', async () => {
    mockContactWithPermissions(mockPermission({ endDate: addDays(-1) }))

    await expectNotFoundError(getLicenceDetails(baseRequest))
  })

  it('includes licences that have been issued but have not yet started', async () => {
    mockContactWithPermissions(mockPermission({ startDate: addDays(30), endDate: addDays(395) }))

    await expect(getLicenceDetails(baseRequest)).resolves.toMatchObject({
      licences: [expect.any(Object)]
    })
  })

  it.each([
    ['junior', MOCK_12MONTH_JUNIOR_PERMIT],
    ['full', MOCK_12MONTH_FULL_PERMIT],
    ['full, disabled', MOCK_12MONTH_DISABLED_PERMIT],
    ['senior', MOCK_12MONTH_SENIOR_PERMIT]
  ])('includes active twelve month licences for %s permits regardless of concession', async (_, permit) => {
    mockContactWithPermissions(mockPermission({ permit }))

    await expect(getLicenceDetails(baseRequest)).resolves.toMatchObject({
      licences: [expect.any(Object)]
    })
  })

  it('returns a valid result for a matching contact', async () => {
    mockContactWithPermissions(mockPermission())

    await expect(getLicenceDetails(baseRequest)).resolves.toMatchObject({
      licences: [
        expect.objectContaining({
          id: MOCK_EXISTING_PERMISSION_ENTITY.id,
          licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
          permit: MOCK_12MONTH_SENIOR_PERMIT.toJSON()
        })
      ]
    })
  })

  it('documents the validation contract for the route query string', () => {
    expect(route[0].options.validate.query).toBeDefined()
  })

  it('handler wraps the licence details in a 200 response', async () => {
    mockContactWithPermissions(mockPermission())
    const code = jest.fn()
    const h = { response: jest.fn().mockReturnValue({ code }) }

    await route[0].options.handler(baseRequest, h)

    expect(h.response).toHaveBeenCalledWith({
      licences: [
        expect.objectContaining({
          id: MOCK_EXISTING_PERMISSION_ENTITY.id,
          licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
          permit: MOCK_12MONTH_SENIOR_PERMIT.toJSON()
        })
      ]
    })
    expect(code).toHaveBeenCalledWith(200)
  })
})
