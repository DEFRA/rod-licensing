import Joi from 'joi'
import { buildJoiOptionSetValidator } from './validators/validators.js'

export const transactionFileParamsSchema = Joi.object({
  fileName: Joi.string()
    .min(1)
    .trim()
    .required()
    .example('ExampleFile.xml')
})

/**
 * Schema for the create import-file request
 * @type {Joi.AnySchema}
 */
export const createTransactionFileSchema = Joi.object({
  dataSource: buildJoiOptionSetValidator('defra_datasource', 'Post Office Sales').optional(),
  status: buildJoiOptionSetValidator('defra_poclfilestatus', 'Received and Pending'),
  fileSize: Joi.string()
    .optional()
    .description('The size of the file'),
  totalCount: Joi.number()
    .optional()
    .description('The total number of sales present in the transaction file'),
  successCount: Joi.number()
    .optional()
    .description('The total number of sales successfully processed when importing the file'),
  errorCount: Joi.number()
    .optional()
    .description('The total number of sales which encountered a processing error when importing the file'),
  notes: Joi.string()
    .optional()
    .description('Any notes associated with the import process for the file'),
  salesDate: Joi.string()
    .isoDate()
    .optional()
    .description('The date relating to when the sales in the file were made')
    .example(new Date().toISOString()),
  receiptTimestamp: Joi.string()
    .isoDate()
    .optional()
    .description('The date at which the file was retrieved')
    .example(new Date().toISOString())
}).label('create-import-file-request')

/**
 * Schema for the create import-file response
 * @type {Joi.AnySchema}
 */
export const createTransactionFileResponseSchema = createTransactionFileSchema
  .append({
    fileName: Joi.string()
      .trim()
      .optional()
  })
  .label('create-import-file-response')
