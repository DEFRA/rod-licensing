import Joi from 'joi'
import { getReferenceDataForEntity, ENTITY_TYPES } from '../../services/reference-data.service.js'
import { referenceDataItemListSchema } from '../../schema/reference-data.schema.js'
import dotProp from 'dot-prop'
import db from 'debug'
const debug = db('sales:routes')

export default ENTITY_TYPES.map(e => ({
  method: 'GET',
  path: `/${e.definition.localCollection}`,
  options: {
    handler: async request => {
      const data = await getReferenceDataForEntity(e)
      const result = data.filter(instance => {
        const json = instance.toJSON()
        return Object.entries(request.query).reduce((acc, [k, v]) => acc && String(dotProp.get(json, k)) === v, true)
      })
      debug(
        'Retrieved %d reference data records for entity %s using params: %o',
        result.length,
        e.definition.localCollection,
        request.params
      )
      return result
    },
    description: `Retrieve reference data for the collection ${e.definition.localCollection}`,
    notes:
      'Retrieve the reference data for the entity collection.  Data may be filtered by specifying params matching the fields for the entity being queried.',
    tags: ['api', 'reference-data'],
    validate: {
      query: Joi.object(
        Object.entries(e.definition.mappings).reduce((acc, [field, v]) => {
          if (v.type === 'optionset') {
            return ['id', 'label', 'description'].reduce(
              (opts, subField) => ({
                ...acc,
                ...opts,
                [`${field}.${subField}`]: Joi.string().description(
                  `Filter for objects where the parameter matches the ${subField} field of the global option set ${field}.`
                )
              }),
              {}
            )
          }
          return { ...acc, [field]: Joi.string().description(`Filter for objects where the parameter matches the ${field} field`) }
        }, {})
      )
    },
    plugins: {
      'hapi-swagger': {
        responses: {
          200: { schema: referenceDataItemListSchema }
        }
      }
    }
  }
}))
