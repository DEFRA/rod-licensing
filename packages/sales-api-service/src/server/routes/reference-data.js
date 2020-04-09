import Boom from '@hapi/boom'
import Joi from '@hapi/joi'
import { getReferenceData } from '../../services/reference-data.service.js'
import { referenceDataCollectionList, referenceDataItemListSchema } from '../../schema/reference-data.schema.js'

const errors = {
  unrecognised_colllection: 'the specified collection does not exist'
}

export default [
  {
    method: 'GET',
    path: '/reference-data',
    options: {
      handler: () => getReferenceData(),
      description: 'Retrieve all reference data',
      notes: 'Retrieves all reference data',
      tags: ['api', 'reference-data'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { schema: referenceDataCollectionList }
          }
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/reference-data/{collection}',
    options: {
      handler: async request => {
        const data = await getReferenceData()
        return data[request.params.collection] || Boom.badRequest(errors.unrecognised_colllection)
      },
      description: 'Retrieve a specific reference data collection',
      notes: 'Retrieve a specific reference data collection',
      tags: ['api', 'reference-data'],
      validate: {
        params: Joi.object({
          collection: Joi.string()
            .required()
            .description('the collection to retrieve')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { schema: referenceDataItemListSchema },
            400: { description: errors.unrecognised_colllection }
          }
        }
      }
    }
  }
]
