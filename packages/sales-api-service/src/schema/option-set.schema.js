import Joi from '@hapi/joi'

export const optionSetOptionExample = { id: 910400000, label: '1 day', description: '' }

export const optionSetOption = Joi.object({
  id: Joi.number().required(),
  label: Joi.string().required(),
  description: Joi.string().required()
})
  .example(optionSetOptionExample)
  .label('option-set-definition-option')

export const optionSetEntriesExample = { 910400000: optionSetOptionExample }
export const optionSetEntries = Joi.object()
  .pattern(Joi.string(), optionSetOption)
  .example(optionSetEntriesExample)
  .label('option-set-definition-options')

export const optionSetDefinition = Joi.object()
  .pattern(Joi.string(), Joi.object({ name: Joi.string().required(), options: optionSetEntries }))
  .example({ option_set_name: { name: 'option_set_name', options: optionSetEntriesExample } })
  .label('option-set-definition')

export const optionSetMappings = Joi.object()
  .example({ option_set_name1: {}, option_set_name2: {} })
  .pattern(Joi.string(), optionSetDefinition)
  .label('option-set-mappings')
