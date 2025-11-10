import initialiseServer from '../../server.js'
import { contactForLicenseeNoReference, executeQuery, permissionForContacts } from '@defra-fish/dynamics-lib'
import {
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_CONCESSION_PROOF_ENTITY,
  MOCK_CONCESSION
} from '../../../__mocks__/test-data.js'
import authenticate from '../authenticate.js'
import { findLinkedRecurringPayment } from '../../../services/recurring-payments.service.js'

const [
  {
    options: { handler }
  }
] = authenticate

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  contactForLicenseeNoReference: jest.fn(),
  executeQuery: jest.fn(),
  permissionForContacts: jest.fn()
}))

jest.mock('../../../services/recurring-payments.service.js', () => ({
  findLinkedRecurringPayment: jest.fn()
}))

let server = null

describe('authenticate handler', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticateRenewal', () => {
    it('authenticates a renewal request', async () => {
      executeQuery.mockResolvedValueOnce([
        {
          entity: MOCK_EXISTING_CONTACT_ENTITY,
          expanded: {}
        }
      ])
      executeQuery.mockResolvedValueOnce([
        {
          entity: MOCK_EXISTING_PERMISSION_ENTITY,
          expanded: {
            licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
            concessionProofs: [{ entity: MOCK_CONCESSION_PROOF_ENTITY, expanded: { concession: { entity: MOCK_CONCESSION } } }],
            permit: { entity: MOCK_1DAY_SENIOR_PERMIT_ENTITY, expanded: {} }
          }
        }
      ])
      executeQuery.mockResolvedValueOnce([{ entity: MOCK_CONCESSION_PROOF_ENTITY, expanded: { concession: { entity: MOCK_CONCESSION } } }])
      const result = await server.inject({
        method: 'GET',
        url: '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'
      })
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({
        permission: expect.objectContaining({
          ...MOCK_EXISTING_PERMISSION_ENTITY.toJSON(),
          licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
          concessions: [
            {
              id: MOCK_CONCESSION.id,
              proof: MOCK_CONCESSION_PROOF_ENTITY.toJSON()
            }
          ],
          permit: MOCK_1DAY_SENIOR_PERMIT_ENTITY.toJSON()
        })
      })
    })

    describe('if no concessions are returned', () => {
      beforeEach(() => {
        executeQuery.mockResolvedValueOnce([
          {
            entity: MOCK_EXISTING_CONTACT_ENTITY,
            expanded: {}
          }
        ])
        executeQuery.mockResolvedValueOnce([
          {
            entity: MOCK_EXISTING_PERMISSION_ENTITY,
            expanded: {
              licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
              concessionProofs: [],
              permit: { entity: MOCK_1DAY_SENIOR_PERMIT_ENTITY, expanded: {} }
            }
          }
        ])
      })

      it('should call contactForLicenseeNoReference with dob and postcode for a renewal request', async () => {
        await server.inject({
          method: 'GET',
          url: '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'
        })
        expect(contactForLicenseeNoReference).toHaveBeenCalledWith('2000-01-01', 'AB12 3CD')
      })

      it('should call permissionForContacts with contact ids from contactForLicenseeNoReference', async () => {
        await server.inject({
          method: 'GET',
          url: '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'
        })
        expect(permissionForContacts).toHaveBeenCalledWith([MOCK_EXISTING_CONTACT_ENTITY.id])
      })

      it('returns 200 from a renewal request', async () => {
        const result = await server.inject({
          method: 'GET',
          url: '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'
        })
        expect(result.statusCode).toBe(200)
      })

      it('returns permission from a renewal request', async () => {
        const result = await server.inject({
          method: 'GET',
          url: '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'
        })
        expect(JSON.parse(result.payload)).toMatchObject({
          permission: expect.objectContaining({
            ...MOCK_EXISTING_PERMISSION_ENTITY.toJSON(),
            licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
            permit: MOCK_1DAY_SENIOR_PERMIT_ENTITY.toJSON()
          })
        })
      })
    })

    it('throws 500 errors if more than one result was found for the query', async () => {
      executeQuery.mockResolvedValueOnce([
        {
          entity: MOCK_EXISTING_CONTACT_ENTITY,
          expanded: {}
        }
      ])
      executeQuery.mockResolvedValueOnce([{ entity: { referenceNumber: 'CD379B' } }, { entity: { referenceNumber: 'CD379B' } }])
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      const result = await server.inject({
        method: 'GET',
        url: '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'
      })
      expect(result.statusCode).toBe(500)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Internal Server Error',
        message: 'Unable to authenticate, non-unique results for query',
        statusCode: 500
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })

    it('throws 401 errors if the renewal could not be authenticated', async () => {
      executeQuery.mockResolvedValueOnce([
        {
          entity: MOCK_EXISTING_CONTACT_ENTITY,
          expanded: {}
        }
      ])
      executeQuery.mockResolvedValueOnce([])
      const result = await server.inject({
        method: 'GET',
        url: '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'
      })
      expect(result.statusCode).toBe(401)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unauthorized',
        message: 'The licensee could not be authenticated',
        statusCode: 401
      })
    })

    it('throws 401 errors if no contact to be authenticated', async () => {
      executeQuery.mockResolvedValueOnce([])
      const result = await server.inject({
        method: 'GET',
        url: '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'
      })
      expect(result.statusCode).toBe(401)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unauthorized',
        message: 'The licensee could not be authenticated',
        statusCode: 401
      })
    })

    it('throws 400 errors if the required parameters are not supplied', async () => {
      const result = await server.inject({ method: 'GET', url: '/authenticate/renewal/CD379B?' })
      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Bad Request',
        message: 'Invalid query: "licenseeBirthDate" is required',
        statusCode: 400
      })
    })
  })

  describe('authenticateRecurringPayment', () => {
    const baseUrl = '/authenticate/rcp/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'

    it('authenticates a recurring payment request and returns recurringPayment', async () => {
      executeQuery
        .mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }])
        .mockResolvedValueOnce([
          {
            entity: MOCK_EXISTING_PERMISSION_ENTITY,
            expanded: {
              licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
              concessionProofs: [{ entity: MOCK_CONCESSION_PROOF_ENTITY, expanded: { concession: { entity: MOCK_CONCESSION } } }],
              permit: { entity: MOCK_1DAY_SENIOR_PERMIT_ENTITY, expanded: {} }
            }
          }
        ])
        .mockResolvedValueOnce([{ entity: MOCK_CONCESSION_PROOF_ENTITY, expanded: { concession: { entity: MOCK_CONCESSION } } }])

      findLinkedRecurringPayment.mockResolvedValueOnce({
        id: 'rcp-123',
        status: 1
      })

      const result = await server.inject({ method: 'GET', url: baseUrl })
      const body = JSON.parse(result.payload)

      expect({
        statusCode: result.statusCode,
        body
      }).toMatchObject({
        statusCode: 200,
        body: {
          permission: expect.objectContaining({
            ...MOCK_EXISTING_PERMISSION_ENTITY.toJSON(),
            licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
            concessions: [
              {
                id: MOCK_CONCESSION.id,
                proof: MOCK_CONCESSION_PROOF_ENTITY.toJSON()
              }
            ],
            permit: MOCK_1DAY_SENIOR_PERMIT_ENTITY.toJSON()
          }),
          recurringPayment: expect.objectContaining({ id: 'rcp-123', status: 1 })
        }
      })
    })

    it('calls findLinkedRecurringPayment with permission id', async () => {
      executeQuery.mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }]).mockResolvedValueOnce([
        {
          entity: MOCK_EXISTING_PERMISSION_ENTITY,
          expanded: {
            licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
            concessionProofs: [],
            permit: { entity: MOCK_1DAY_SENIOR_PERMIT_ENTITY, expanded: {} }
          }
        }
      ])

      findLinkedRecurringPayment.mockResolvedValueOnce({ id: 'rcp-123' })

      await server.inject({ method: 'GET', url: baseUrl })

      expect(findLinkedRecurringPayment).toHaveBeenCalledWith(MOCK_EXISTING_PERMISSION_ENTITY.id)
    })

    it('returns 401 when no contacts found', async () => {
      executeQuery.mockResolvedValueOnce([])

      const result = await server.inject({ method: 'GET', url: baseUrl })
      const body = JSON.parse(result.payload)

      expect({
        statusCode: result.statusCode,
        body
      }).toMatchObject({
        statusCode: 401,
        body: {
          error: 'Unauthorized',
          message: 'The licensee could not be authenticated'
        }
      })
    })

    it('returns 401 when no permissions match', async () => {
      executeQuery.mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }]).mockResolvedValueOnce([])

      const result = await server.inject({ method: 'GET', url: baseUrl })
      const body = JSON.parse(result.payload)

      expect({
        statusCode: result.statusCode,
        body
      }).toMatchObject({
        statusCode: 401,
        body: {
          error: 'Unauthorized',
          message: 'The licensee could not be authenticated'
        }
      })
    })

    it('returns 500 when multiple permissions match', async () => {
      executeQuery.mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }]).mockResolvedValueOnce([
        {
          entity: { id: 'p1', referenceNumber: 'CD379B' },
          expanded: { concessionProofs: [], licensee: { entity: {}, expanded: {} }, permit: { entity: {}, expanded: {} } }
        },
        {
          entity: { id: 'p2', referenceNumber: 'CD379B' },
          expanded: { concessionProofs: [], licensee: { entity: {}, expanded: {} }, permit: { entity: {}, expanded: {} } }
        }
      ])

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())

      const result = await server.inject({ method: 'GET', url: baseUrl })
      const body = JSON.parse(result.payload)

      expect({
        statusCode: result.statusCode,
        body
      }).toMatchObject({
        statusCode: 500,
        body: {
          error: 'Internal Server Error',
          message: 'Unable to authenticate, non-unique results for query'
        }
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })

    it('returns 400 when query params are missing', async () => {
      const result = await server.inject({ method: 'GET', url: '/authenticate/rcp/CD379B?' })
      const body = JSON.parse(result.payload)

      expect({
        statusCode: result.statusCode,
        body
      }).toMatchObject({
        statusCode: 400,
        body: {
          error: 'Bad Request',
          message: 'Invalid query: "licenseeBirthDate" is required'
        }
      })
    })

    describe('if no concessions are returned', () => {
      it('returns permission and recurringPayment without concessions', async () => {
        executeQuery.mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }]).mockResolvedValueOnce([
          {
            entity: MOCK_EXISTING_PERMISSION_ENTITY,
            expanded: {
              licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
              concessionProofs: [],
              permit: { entity: MOCK_1DAY_SENIOR_PERMIT_ENTITY, expanded: {} }
            }
          }
        ])

        findLinkedRecurringPayment.mockResolvedValueOnce({
          id: 'rcp-789',
          status: 1
        })

        const result = await server.inject({ method: 'GET', url: baseUrl })
        const body = JSON.parse(result.payload)

        expect({
          statusCode: result.statusCode,
          body
        }).toMatchObject({
          statusCode: 200,
          body: {
            permission: expect.objectContaining({
              ...MOCK_EXISTING_PERMISSION_ENTITY.toJSON(),
              licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
              concessions: [],
              permit: MOCK_1DAY_SENIOR_PERMIT_ENTITY.toJSON()
            }),
            recurringPayment: expect.objectContaining({ id: 'rcp-789', status: 1 })
          }
        })
      })
    })
  })

  it('changes reference number to uppercase', async () => {
    const sampleQueryReferenceNumber = 'abc123'
    const sampleResultReferenceNumber = sampleQueryReferenceNumber.toUpperCase()
    const makeMockEntity = (obj = {}) => ({
      ...obj,
      toJSON: () => obj
    })
    executeQuery.mockReturnValueOnce([{ entity: { id: 'hgk-999' } }]).mockReturnValueOnce([
      {
        entity: makeMockEntity({
          referenceNumber: sampleResultReferenceNumber
        }),
        expanded: {
          concessionProofs: [],
          licensee: { entity: makeMockEntity() },
          permit: { entity: makeMockEntity() }
        }
      }
    ])
    const mockRequest = {
      query: { licenseeBirthDate: '', licenseePostcode: '' },
      params: { referenceNumber: sampleQueryReferenceNumber }
    }
    const mockResponseToolkit = { response: jest.fn(() => ({ code: () => {} })) }

    await handler(mockRequest, mockResponseToolkit)

    expect(mockResponseToolkit.response).toHaveBeenCalledWith(
      expect.objectContaining({
        permission: expect.objectContaining({
          referenceNumber: sampleResultReferenceNumber
        })
      })
    )
  })
})
