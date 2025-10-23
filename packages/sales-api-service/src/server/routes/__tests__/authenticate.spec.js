import initialiseServer from '../../server.js'
import { contactForLicenseeNoReference, executeQuery, permissionForContacts } from '@defra-fish/dynamics-lib'
import { findLinkedRecurringPayment } from '../../../services/recurring-payments.service.js'
import {
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_CONCESSION_PROOF_ENTITY,
  MOCK_CONCESSION
} from '../../../__mocks__/test-data.js'

import db from 'debug'
jest.mock('debug')

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
    const baseUrl = '/authenticate/renewal/CD379B?licenseeBirthDate=2000-01-01&licenseePostcode=AB12 3CD'

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
        url: baseUrl
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
          url: baseUrl
        })
        expect(contactForLicenseeNoReference).toHaveBeenCalledWith('2000-01-01', 'AB12 3CD')
      })

      it('should call permissionForContacts with contact ids from contactForLicenseeNoReference', async () => {
        await server.inject({
          method: 'GET',
          url: baseUrl
        })
        expect(permissionForContacts).toHaveBeenCalledWith([MOCK_EXISTING_CONTACT_ENTITY.id])
      })

      it('returns 200 from a renewal request', async () => {
        const result = await server.inject({
          method: 'GET',
          url: baseUrl
        })
        expect(result.statusCode).toBe(200)
      })

      it('returns permission from a renewal request', async () => {
        const result = await server.inject({
          method: 'GET',
          url: baseUrl
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
        url: baseUrl
      })
      expect(result.statusCode).toBe(500)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Internal Server Error',
        message: 'Unable to authenticate, non-unique results for query',
        statusCode: 500
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
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
        url: baseUrl
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
        url: baseUrl
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

    it('authenticates a recurring payment cancellation request', async () => {
      executeQuery.mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }]).mockResolvedValueOnce([
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
      findLinkedRecurringPayment.mockResolvedValueOnce({
        entity: { id: 'recurring-payment-id-1', status: 0, cancelledDate: null },
        toJSON: () => ({ id: 'recurring-payment-id-1', status: 0, cancelledDate: null })
      })

      const result = await server.inject({ method: 'GET', url: baseUrl })
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
        }),
        recurringPayment: expect.objectContaining({ id: 'recurring-payment-id-1', status: 0 })
      })
    })

    it('should call findLinkedRecurringPayment with permission id', async () => {
      const permission = MOCK_EXISTING_PERMISSION_ENTITY
      executeQuery.mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }]).mockResolvedValueOnce([
        {
          entity: permission,
          expanded: {
            licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
            concessionProofs: [],
            permit: { entity: MOCK_1DAY_SENIOR_PERMIT_ENTITY, expanded: {} }
          }
        }
      ])

      findLinkedRecurringPayment.mockResolvedValueOnce({
        entity: { id: 'recurring-payment-id-1', status: 0, cancelledDate: null },
        toJSON: () => ({ id: 'recurring-payment-id-1', status: 0, cancelledDate: null })
      })

      await server.inject({ method: 'GET', url: baseUrl })
      expect(findLinkedRecurringPayment).toHaveBeenCalledWith(permission.id)
    })

    it('throws 500 errors if more than one result was found for the query', async () => {
      executeQuery
        .mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }])
        .mockResolvedValueOnce([{ entity: { referenceNumber: 'CD379B' } }, { entity: { referenceNumber: 'CD379B' } }])

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())

      const result = await server.inject({ method: 'GET', url: baseUrl })
      expect(result.statusCode).toBe(500)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Internal Server Error',
        message: 'Unable to authenticate, non-unique results for query'
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('throws 401 errors if the renewal could not be authenticated', async () => {
      executeQuery.mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }]).mockResolvedValueOnce([])
      const result = await server.inject({ method: 'GET', url: baseUrl })
      expect(result.statusCode).toBe(401)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unauthorized',
        message: 'The licensee could not be authenticated'
      })
    })

    it('throws 401 errors if no contact to be authenticated', async () => {
      executeQuery.mockResolvedValueOnce([])
      const result = await server.inject({ method: 'GET', url: baseUrl })
      expect(result.statusCode).toBe(401)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unauthorized',
        message: 'The licensee could not be authenticated'
      })
    })

    it('throws 400 errors if the required parameters are not supplied', async () => {
      const result = await server.inject({ method: 'GET', url: '/authenticate/rcp/CD379B?' })
      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Bad Request',
        message: 'Invalid query: "licenseeBirthDate" is required'
      })
    })

    describe('if no concessions are returned', () => {
      beforeEach(() => {
        executeQuery.mockResolvedValueOnce([{ entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} }])
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
        findLinkedRecurringPayment.mockResolvedValueOnce({
          entity: { id: 'recurring-payment-id-1', status: 0, cancelledDate: null },
          toJSON: () => ({ id: 'recurring-payment-id-1', status: 0, cancelledDate: null })
        })
      })

      it('should call contactForLicenseeNoReference with dob and postcode for a renewal request', async () => {
        await server.inject({ method: 'GET', url: baseUrl })
        expect(contactForLicenseeNoReference).toHaveBeenCalledWith('2000-01-01', 'AB12 3CD')
      })

      it('should call permissionForContacts with contact ids from contactForLicenseeNoReference', async () => {
        await server.inject({ method: 'GET', url: baseUrl })
        expect(permissionForContacts).toHaveBeenCalledWith([MOCK_EXISTING_CONTACT_ENTITY.id])
      })

      it('returns 200 from a renewal request', async () => {
        const result = await server.inject({ method: 'GET', url: baseUrl })
        expect(result.statusCode).toBe(200)
      })

      it('returns permission from a renewal request', async () => {
        const result = await server.inject({ method: 'GET', url: baseUrl })
        expect(JSON.parse(result.payload)).toMatchObject({
          permission: expect.objectContaining({
            ...MOCK_EXISTING_PERMISSION_ENTITY.toJSON(),
            licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
            concessions: [],
            permit: MOCK_1DAY_SENIOR_PERMIT_ENTITY.toJSON()
          }),
          recurringPayment: expect.objectContaining({ id: 'recurring-payment-id-1', status: 0 })
        })
      })
    })
  })

  describe('executeWithErrorLog', () => {
    let logSpy, executeWithErrorLog

    beforeEach(async () => {
      jest.resetModules()

      logSpy = jest.fn()
      jest.doMock('debug', () => jest.fn(() => logSpy))

      jest.doMock('@defra-fish/dynamics-lib', () => {
        const actual = jest.requireActual('@defra-fish/dynamics-lib')
        return {
          ...actual,
          executeQuery: jest.fn().mockRejectedValue(new Error('oopsie'))
        }
      })

      const { _test_ } = await import('../authenticate.js')
      ;({ executeWithErrorLog } = _test_)
    })

    it('rejects when executeQuery fails', async () => {
      await expect(executeWithErrorLog({ filter: 'query filter test' })).rejects.toThrow()
    })

    it('logs the filter on failure', async () => {
      await executeWithErrorLog({ filter: 'query filter test' }).catch(() => {})
      expect(logSpy).toHaveBeenCalledWith('Error executing query with filter query filter test')
    })
  })
})
