import moment from 'moment'
import initialiseServer from '../../server.js'
import { contactForLicenseeByPersonalDetails, executeQuery, permissionForContacts, Permission } from '@defra-fish/dynamics-lib'
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

let server = null

describe('licence-details handler', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const baseUrl = '/licenceDetails?licenseeFirstName=Bilbo&licenseeLastName=Baggins&licenseeBirthDate=2000-10-03&licenseePostcode=AB123CD'

  const mockContact = () => ({ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} })

  const addDays = days => moment().add(days, 'days').toISOString()

  const mockPermission = ({ permit = MOCK_12MONTH_SENIOR_PERMIT, startDate = addDays(-30), endDate = addDays(30) } = {}) => ({
    entity: Object.assign(new Permission(), MOCK_EXISTING_PERMISSION_ENTITY, { startDate, endDate }),
    expanded: {
      licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
      permit: { entity: permit, expanded: {} }
    }
  })

  it('returns 500 if executeQuery throws', async () => {
    executeQuery.mockRejectedValueOnce(new Error('some error'))

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(result.statusCode).toBe(500)
  })

  it('calls contactForLicenseeByPersonalDetails with the name, dob and postcode from the query', async () => {
    executeQuery.mockResolvedValueOnce([mockContact()])

    await server.inject({ method: 'GET', url: baseUrl })

    expect(contactForLicenseeByPersonalDetails).toHaveBeenCalledWith({
      licenseeFirstName: 'Bilbo',
      licenseeLastName: 'Baggins',
      licenseeBirthDate: '2000-10-03',
      licenseePostcode: 'AB12 3CD'
    })
  })

  it.each([
    ['statusCode', result => result.statusCode, 404],
    ['message', result => JSON.parse(result.payload).message, 'Licence details could not be found for the provided contact details']
  ])('returns the not found %s if no contacts match the provided details', async (_, actual, expected) => {
    executeQuery.mockResolvedValueOnce([])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(actual(result)).toBe(expected)
  })

  it('does not call permissionForContacts if no contacts match the provided details', async () => {
    executeQuery.mockResolvedValueOnce([])

    await server.inject({ method: 'GET', url: baseUrl })

    expect(permissionForContacts).not.toHaveBeenCalled()
  })

  it('calls permissionForContacts with contact ids from contactForLicenseeByPersonalDetails', async () => {
    executeQuery.mockResolvedValueOnce([mockContact()])

    await server.inject({ method: 'GET', url: baseUrl })

    expect(permissionForContacts).toHaveBeenCalledWith([MOCK_EXISTING_CONTACT_ENTITY.id])
  })

  it.each([
    ['statusCode', result => result.statusCode, 404],
    ['message', result => JSON.parse(result.payload).message, 'Licence details could not be found for the provided contact details']
  ])('returns the not found %s if no permissions are found for the matching contacts', async (_, actual, expected) => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce([])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(actual(result)).toBe(expected)
  })

  it('returns licence details matching the expected shape', async () => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    const permission = mockPermission()
    executeQuery.mockResolvedValueOnce([permission])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(JSON.parse(result.payload)).toMatchObject({
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
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce([mockPermission(), mockPermission()])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(JSON.parse(result.payload).licences).toHaveLength(2)
  })

  it.each([
    ['1-day', MOCK_1DAY_SENIOR_PERMIT_ENTITY],
    ['8-day', MOCK_8DAY_SENIOR_PERMIT_ENTITY]
  ])('excludes %s permits from the response', async (_, permit) => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce([mockPermission({ permit })])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(result.statusCode).toBe(404)
  })

  it('excludes expired licences from the response', async () => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce([mockPermission({ endDate: addDays(-1) })])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(result.statusCode).toBe(404)
  })

  it('includes licences that have been issued but have not yet started', async () => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce([mockPermission({ startDate: addDays(30), endDate: addDays(395) })])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(result.statusCode).toBe(200)
  })

  it.each([
    ['junior', MOCK_12MONTH_JUNIOR_PERMIT],
    ['full', MOCK_12MONTH_FULL_PERMIT],
    ['full, disabled', MOCK_12MONTH_DISABLED_PERMIT],
    ['senior', MOCK_12MONTH_SENIOR_PERMIT]
  ])('includes active twelve month licences for %s permits regardless of concession', async (_, permit) => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce([mockPermission({ permit })])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(result.statusCode).toBe(200)
  })

  it('returns 200 for a matching contact', async () => {
    executeQuery.mockResolvedValueOnce([mockContact()])
    executeQuery.mockResolvedValueOnce([mockPermission()])

    const result = await server.inject({ method: 'GET', url: baseUrl })

    expect(result.statusCode).toBe(200)
  })

  it('returns 400 if required query parameters are missing', async () => {
    const result = await server.inject({ method: 'GET', url: '/licenceDetails' })

    expect(result.statusCode).toBe(400)
  })
})
