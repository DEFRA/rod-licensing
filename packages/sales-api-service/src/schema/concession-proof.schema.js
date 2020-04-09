import Joi from '@hapi/joi'
import { createOptionSetValidator, createReferenceDataEntityValidator } from './validators/index.js'
import { Concession } from '@defra-fish/dynamics-lib'

export const concessionProofSchema = Joi.object({
  concessionId: Joi.string()
    .guid()
    .external(createReferenceDataEntityValidator(Concession))
    .example('d0ece997-ef65-e611-80dc-c4346bad4004'),
  proof: Joi.object({
    type: Joi.string()
      .external(createOptionSetValidator('defra_concessionproof'))
      .required()
      .description('See defra_concessionproof for available options')
      .example('National Insurance Number'),
    referenceNumber: Joi.string()
      .optional()
      .example('AB 01 02 03 CD')
  }).required()
}).label('concession-proof')
