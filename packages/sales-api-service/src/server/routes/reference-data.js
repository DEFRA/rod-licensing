import Boom from '@hapi/boom'
import Joi from '@hapi/joi'
import { getReferenceData } from '../../services/reference-data.js'

const errors = {
  unrecognised_colllection: 'the specified collection does not exist'
}

const referenceDataItemExample = {
  id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
  description: 'Field example'
}
const referenceDataItemSchema = Joi.object({
  id: Joi.string()
    .required()
    .example('f1bb733e-3b1e-ea11-a810-000d3a25c5d6')
})
  .example(referenceDataItemExample)
  .label('reference-data-item')

const referenceDataItemListSchema = Joi.array()
  .items(referenceDataItemSchema)
  .label('reference-data-item-list')
const referenceDataCollection = Joi.object()
  .example({ ExampleCollection: [referenceDataItemExample] })
  .pattern(Joi.string(), referenceDataItemListSchema)
  .label('reference-data-collection')

const referenceDataCollectionList = Joi.array()
  .items(referenceDataCollection)
  .label('reference-data-collection-list')

export default [
  {
    method: 'GET',
    path: '/reference-data',
    options: {
      handler: (request, h) => {
        return getReferenceData()
      },
      description: 'Retrieve all reference data',
      notes: 'Retrieves all reference data',
      tags: ['api'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { schema: referenceDataCollectionList },
            400: { description: errors.unrecognised_colllection }
          }
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/reference-data/{collection}',
    options: {
      handler: async (request, h) => {
        const data = await getReferenceData()
        return data[request.params.collection] || Boom.badRequest(errors.unrecognised_colllection)
      },
      description: 'Query reference data',
      notes: 'Query reference data notes...',
      tags: ['api'],
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
