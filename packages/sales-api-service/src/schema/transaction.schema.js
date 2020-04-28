import Joi from '@hapi/joi'
import { createPermissionSchema, createPermissionResponseSchema } from './permission.schema.js'
import { contactSchema } from './contact.schema.js'
import { createOptionSetValidator } from './validators/index.js'
import uuid from 'uuid/v4.js'

export const createTransactionSchema = Joi.object({
  permissions: Joi.array()
    .min(1)
    .max(50)
    .items(createPermissionSchema)
    .required()
    .label('create-transaction-request-permissions'),
  dataSource: createOptionSetValidator('defra_datasource', 'Web Sales')
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
  dataSource: createOptionSetValidator('defra_datasource', 'Web Sales')
}).label('create-transaction-response')

export const finaliseTransactionSchema = Joi.object({
  paymentTimestamp: Joi.string()
    .isoDate()
    .required()
    .description('An ISO8601 compatible date string defining when the transaction was completed')
    .example(new Date().toISOString()),
  paymentSource: createOptionSetValidator('defra_financialtransactionsource', 'Gov Pay'),
  paymentMethod: createOptionSetValidator('defra_paymenttype', 'Debit card'),
  recurringPayment: Joi.object({
    payer: contactSchema,
    referenceNumber: Joi.string()
      .required()
      .description('The reference number associated with the recurring payment')
      .example(uuid()),
    mandate: Joi.string()
      .required()
      .description('The mandate identifier associated with the recurring payment')
      .example(uuid())
  })
    .description('Used to establish a recurring payment (e.g. via Direct Debit)')
    .optional()
}).label('complete-transaction-request')
