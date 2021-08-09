import initialiseServer from '../../server.js'
import { executeQuery, permissionForLicensee } from '@defra-fish/dynamics-lib'
import {
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_CONCESSION_PROOF_ENTITY,
  MOCK_CONCESSION
} from '../../../__mocks__/test-data.js'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  permissionForLicensee: jest.fn(),
  executeQuery: jest.fn()
}))

let server = null

describe('authenticate handler', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('authenticateRenewal', () => {
    it('authenticates a renewal request', async () => {
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
      expect(permissionForLicensee).toHaveBeenCalledWith('CD379B', '2000-01-01', 'AB12 3CD')
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

    it('throws 500 errors if more than one result was found for the query', async () => {
      executeQuery.mockResolvedValueOnce([{}, {}])
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
    })

    it('throws 401 errors if the renewal could not be authenticated', async () => {
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
})
