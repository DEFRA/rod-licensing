import Boom from '@hapi/boom'
import Joi from 'joi'
import { getGlobalOptionSets, getGlobalOptionSet } from '../../services/reference-data.service.js'
import { optionSetMappings, optionSetDefinition } from '../../schema/option-set.schema.js'

const errors = {
  unrecognised_optionset: 'the specified option-set does not exist'
}

export default [
  {
    method: 'GET',
    path: '/option-sets',
    options: {
      handler: async () => getGlobalOptionSets(),
      description: 'Retrieve all option set definitions',
      notes: 'Retrieve all option sets definitions',
      tags: ['api', 'option-sets'],
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
        const data = await getGlobalOptionSet(request.params.setName)
        return data || Boom.badRequest(errors.unrecognised_optionset)
      },
      description: 'Retrieve a specific option set definition',
      notes: 'Retrieve a specific option set definition',
      tags: ['api', 'option-sets'],
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
