import Joi from 'joi'

export const optionSetOptionExample = { id: 910400000, label: 'Example Label', description: 'Example Description' }

export const optionSetOption = Joi.object({
  id: Joi.number().required(),
  label: Joi.string().required(),
  description: Joi.string().required()
})
  .example(optionSetOptionExample)
  .label('option-set-definition-option')

export const optionSetEntriesExample = { 910400000: optionSetOptionExample }
export const optionSetEntries = Joi.object({})
  .pattern(Joi.string().label('option-set-name'), optionSetOption)
  .example(optionSetEntriesExample)
  .label('option-set-definition-options')

export const optionSetDefinitionExample = { name: 'option_set_name', options: optionSetEntriesExample }
export const optionSetDefinition = Joi.object({
  name: Joi.string().required(),
  options: optionSetEntries
})
  .example(optionSetDefinitionExample)
  .label('option-set-definition')
  .description('option-set-definition')

export const optionSetMappings = Joi.object()
  .example({ option_set_name1: optionSetDefinitionExample, option_set_name2: optionSetDefinitionExample })
  .pattern(/.*/, optionSetDefinition)
  .label('option-set-mappings')
  .description('A listing of all option-sets, using the option set name as the key')
