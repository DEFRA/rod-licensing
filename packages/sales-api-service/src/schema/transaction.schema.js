import Joi from '@hapi/joi'
import { createPermissionSchema, createPermissionResponseSchema } from './permission.schema.js'
import { createOptionSetValidator } from './validators/index.js'

const dataSourceValidator = Joi.string()
  .trim()
  .external(createOptionSetValidator('defra_datasource'))
  .required()
  .description('See defra_datasource for available options')
  .example('Web Sales')

export const createTransactionSchema = Joi.object({
  permissions: Joi.array()
    .min(1)
    .items(createPermissionSchema)
    .required()
    .label('create-transaction-request-permissions'),
  dataSource: dataSourceValidator
}).label('create-transaction-request')

export const createTransactionResponseSchema = Joi.object({
  id: Joi.string()
    .trim()
    .guid()
    .required(),
  expires: Joi.number().required(),
  permissions: Joi.array()
    .min(1)
    .items(createPermissionResponseSchema)
    .external(permissions => {
      // Check for duplicate permission reference numbers in the list of permissions
      const counts = permissions.map(p => p.referenceNumber).reduce((acc, val) => ({ ...acc, [val]: (acc[val] || 0) + 1 }), {})
      const duplicates = Object.entries(counts)
        .filter(([, v]) => v > 1)
        .map(([k]) => k)
      if (duplicates.length) {
        throw new Error(`The permissions list contains duplicate reference numbers: ${duplicates}`)
      }
    })
    .required()
    .label('create-transaction-response-permissions'),
  dataSource: dataSourceValidator
}).label('create-transaction-response')
