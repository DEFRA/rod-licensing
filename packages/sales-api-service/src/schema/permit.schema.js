import Joi from '@hapi/joi'
import { optionSetOption } from './option-set.schema.js'
import { v4 as uuid } from 'uuid'

export const permitSchema = Joi.object({
  id: Joi.string()
    .guid()
    .required()
    .example(uuid()),
  description: Joi.string()
    .required()
    .example('Coarse 12 month 3 Rod Licence (Senior, Disabled)'),
  permitType: optionSetOption,
  permitSubtype: optionSetOption,
  durationMagnitude: 12,
  durationDesignator: optionSetOption,
  numberOfRods: 3,
  availableFrom: Joi.string()
    .isoDate()
    .required()
    .description('An ISO8601 compatible date string defining when the permit is available from')
    .example(new Date().toISOString()),
  availableTo: Joi.string()
    .isoDate()
    .required()
    .description('An ISO8601 compatible date string defining when the permit is available to')
    .example(new Date().toISOString()),
  isForFulfilment: Joi.boolean().required(),
  isCounterSales: Joi.boolean().required(),
  isRecurringPaymentSupported: Joi.boolean().required(),
  cost: Joi.number()
    .integer()
    .example(30),
  itemId: Joi.number()
    .integer()
    .example('42347')
}).label('permit')
