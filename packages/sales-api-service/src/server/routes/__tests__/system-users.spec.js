import initialiseServer from '../../index.js'
import { findByExample, SystemUser, SystemUserRole } from '@defra-fish/dynamics-lib'

jest.mock('../../../services/reference-data.service.js', () => ({
  ENTITY_TYPES: [],
  getReferenceDataForEntity: jest.fn(async entityType => {
    return [
      {
        id: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
        name: 'Test role 1'
      },
      {
        id: 'e739f82a-9519-e911-817c-000d3a0718d1',
        name: 'Test role 2'
      }
    ]
  })
}))

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  persist: jest.fn(),
  findByExample: jest.fn()
}))

let server = null

describe('system users', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(jest.clearAllMocks)

  describe('getSystemUserForOid', () => {
    it('retrieves details of a system user and their assigned roles', async () => {
      findByExample.mockResolvedValueOnce([
        Object.assign(new SystemUser(), {
          oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
          lastName: 'Gardner-Dell',
          firstName: 'Sam',
          isDisabled: false
        })
      ])
      findByExample.mockResolvedValueOnce([
        Object.assign(new SystemUserRole(), {
          roleId: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
          systemUserId: '26449770-5e67-e911-a988-000d3ab9df39'
        }),
        Object.assign(new SystemUserRole(), {
          roleId: 'e739f82a-9519-e911-817c-000d3a0718d1',
          systemUserId: '26449770-5e67-e911-a988-000d3ab9df39'
        })
      ])
      const result = await server.inject({ method: 'GET', url: '/systemUsers/e4661642-0a25-4d49-b7bd-8178699e0161', payload: {} })
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({
        firstName: 'Sam',
        isDisabled: false,
        lastName: 'Gardner-Dell',
        oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
        roles: [
          {
            id: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
            name: 'Test role 1'
          },
          {
            id: 'e739f82a-9519-e911-817c-000d3a0718d1',
            name: 'Test role 2'
          }
        ]
      })
    })

    it('throws 404 not found if the user does not exist', async () => {
      findByExample.mockResolvedValue([])
      const result = await server.inject({ method: 'GET', url: '/systemUsers/e4661642-0a25-4d49-b7bd-8178699e0161', payload: {} })
      expect(result.statusCode).toBe(404)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Not Found',
        message: 'System user for oid "e4661642-0a25-4d49-b7bd-8178699e0161" not found',
        statusCode: 404
      })
    })
  })
})
