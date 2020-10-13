import Joi from 'joi'

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
