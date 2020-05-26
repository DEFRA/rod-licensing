import Joi from '@hapi/joi'
import { buildJoiOptionSetValidator, createReferenceDataEntityValidator } from './validators/validators.js'
import { Concession } from '@defra-fish/dynamics-lib'

export const concessionProofSchema = Joi.object({
  concessionId: Joi.string()
    .guid()
    .external(createReferenceDataEntityValidator(Concession))
    .example('d0ece997-ef65-e611-80dc-c4346bad4004'),
  proof: Joi.object({
    type: buildJoiOptionSetValidator('defra_concessionproof', 'National Insurance Number'),
    referenceNumber: Joi.string()
      .optional()
      .example('QQ 12 34 56 C')
  })
    .label('concession-proof-details')
    .required()
}).label('concession-proof')
