import Joi from 'joi'
import { LICENCE_FOR } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { initialiseSession } from '../../../handlers/new-session-handler.js'

export const validator = Joi.object({
  'licence-for': Joi.string()
    .valid('you', 'someone-else')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

const licenceForKey = 'licence-for'
const route = pageRoute(LICENCE_FOR.page, LICENCE_FOR.uri, validator, nextPage)
const handler = route[1].handler
route[1].handler = async (request, h) => {
  const permission = await request.cache().helpers.page.getCurrentPermission()
  const licenceForHasChanged = permission[licenceForKey].payload[licenceForKey] !== request.payload[licenceForKey]
  if (licenceForHasChanged) {
    initialiseSession(request)
  }
  return handler(request, h)
}
export default route
