import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'
import { NAME, CONTROLLER } from '../../constants.js'

import substitutes from './substitutes.js'
const custom = Joi.string().extend({
  type: 'name',
  coerce (value, helpers) {
    if (helpers.schema.$_getRule('allowable')) {
      return { value: substitutes(value) }
    }
  },
  rules: {
    allowable: {
      validate (value, helpers, args, options) {
        if (
          !/^[A-Za-z\u0020\u0027\u002c\u002d\u002e\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\u0100-\u017f\u0180-\u01ff\u0200-\u024f\u0250-\u02af\u0370-\u0fff]+$/g.test(
            value
          )
        ) {
          return helpers.error('string.forbidden')
        }
        return value
      }
    }
  },
  messages: {
    'string.forbidden': '{{#label}} contains forbidden characters'
  }
})

const validator = Joi.object({
  'first-name': custom
    .allowable()
    .min(2)
    .max(100)
    .required(),
  'last-name': custom
    .allowable()
    .min(2)
    .max(100)
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(NAME.page, NAME.uri, validator, CONTROLLER.uri)
