import Boom from '@hapi/boom'
import { findByExample, SystemUser, SystemUserRole, Role } from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntity } from '../../services/reference-data.service.js'
import { systemUsersRequestParamsSchema, systemUsersResponseSchema } from '../../schema/system-user.schema.js'

export default [
  {
    method: 'GET',
    path: '/systemUsers/{oid}',
    options: {
      handler: async (request, h) => {
        const matchedUsers = await findByExample(Object.assign(new SystemUser(), { oid: request.params.oid }))
        if (matchedUsers.length !== 1) {
          throw Boom.notFound(`System user for oid "${request.params.oid}" not found`)
        }
        const user = matchedUsers[0]
        const userRoles = await findByExample(Object.assign(new SystemUserRole(), { systemUserId: user.id }))
        const roles = await getReferenceDataForEntity(Role)
        return h
          .response({
            ...user.toJSON(),
            roles: userRoles.map(userRole => roles.find(role => role.id === userRole.roleId))
          })
          .code(200)
      },
      description: 'Retrieve user information for the given azure directory object id',
      notes: `
        Retrieve user information for the given azure directory object id
      `,
      tags: ['api', 'systemUsers'],
      validate: {
        params: systemUsersRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'The system user was found', schema: systemUsersResponseSchema },
            404: { description: 'The system user could not be found' }
          },
          order: 1
        }
      }
    }
  }
]
