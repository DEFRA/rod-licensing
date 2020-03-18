import Boom from '@hapi/boom'
import Joi from '@hapi/joi'
import { getGlobalOptionSets } from '../../services/reference-data.js'

const errors = {
  unrecognised_optionset: 'the specified option-set does not exist'
}

const optionSetOptionExample = { id: 910400000, label: '1 day', description: '' }

const optionSetOption = Joi.object({
  id: Joi.number().required(),
  label: Joi.string().required(),
  description: Joi.string().required()
})
  .example(optionSetOptionExample)
  .label('option-set-definition-option')

const optionSetEntriesExample = { 910400000: optionSetOptionExample }
const optionSetEntries = Joi.object()
  .pattern(Joi.string(), optionSetOption)
  .example(optionSetEntriesExample)
  .label('option-set-definition-options')

const optionSetDefinition = Joi.object()
  .pattern(Joi.string(), Joi.object({ name: Joi.string().required(), options: optionSetEntries }))
  .example({ option_set_name: { name: 'option_set_name', options: optionSetEntriesExample } })
  .label('option-set-definition')

const optionSetMappings = Joi.object()
  .example({ option_set_name1: {}, option_set_name2: {} })
  .pattern(Joi.string(), optionSetDefinition)
  .label('option-set-mappings')

export default [
  {
    method: 'GET',
    path: '/option-sets',
    options: {
      handler: async () => getGlobalOptionSets(),
      description: 'Retrieve all option set definitions',
      notes: 'Retrieve all option sets definitions',
      tags: ['api'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { schema: optionSetMappings }
          }
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/option-sets/{setName}',
    options: {
      handler: async request => {
        const data = await getGlobalOptionSets(request.params.setName)
        return (Object.keys(data).length && data) || Boom.badRequest(errors.unrecognised_optionset)
      },
      description: 'Retrieve a specific option set definition',
      notes: 'Retrieve a specific option set definition',
      tags: ['api'],
      validate: {
        params: Joi.object({
          setName: Joi.string()
            .required()
            .description('the name of the option-set to retrieve')
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { schema: optionSetDefinition },
            400: { description: errors.unrecognised_optionset }
          }
        }
      }
    }
  }
]
