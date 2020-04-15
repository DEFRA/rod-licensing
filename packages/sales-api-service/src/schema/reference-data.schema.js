import Joi from '@hapi/joi'

export const referenceDataItemExample = {
  id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
  description: 'Field example'
}

export const referenceDataItemSchema = Joi.object({
  id: Joi.string()
    .required()
    .example('f1bb733e-3b1e-ea11-a810-000d3a25c5d6')
})
  .example(referenceDataItemExample)
  .label('reference-data-item')

export const referenceDataItemListSchema = Joi.array()
  .items(referenceDataItemSchema)
  .label('reference-data-item-list')

export const referenceDataCollection = Joi.object()
  .example({ ExampleCollection: [referenceDataItemExample] })
  .pattern(Joi.string(), referenceDataItemListSchema)
  .label('reference-data-collection')

export const referenceDataCollectionList = Joi.array()
  .items(referenceDataCollection)
  .label('reference-data-collection-list')
