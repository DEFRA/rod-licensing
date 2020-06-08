import Joi from '@hapi/joi'
import { buildJoiOptionSetValidator, createReferenceDataEntityValidator } from './validators/validators.js'
import { Concession } from '@defra-fish/dynamics-lib'
import { v4 as uuid } from 'uuid'

export const concessionProofSchema = Joi.array()
  .items(
    Joi.object({
      id: Joi.string()
        .guid()
        .external(createReferenceDataEntityValidator(Concession))
        .required()
        .example(uuid()),
      proof: Joi.object({
        type: buildJoiOptionSetValidator('defra_concessionproof', 'National Insurance Number'),
        referenceNumber: Joi.string()
          .optional()
          .example('QQ 12 34 56 C')
      })
        .label('concession-proof-details')
        .required()
    }).label('concession-proof')
  )
  .label('concession-proof-list')
