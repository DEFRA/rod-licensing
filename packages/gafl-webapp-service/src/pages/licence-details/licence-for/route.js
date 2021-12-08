import Joi from 'joi'
import { LICENCE_FOR } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'

export const validator = Joi.object({
  'licence-for': Joi.string()
    .valid('you', 'someone-else')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

const route = pageRoute(LICENCE_FOR.page, LICENCE_FOR.uri, validator, nextPage)
const postRoute = route.find(r => r.method === 'POST')
const { handler } = postRoute
postRoute.handler = async (request, h) => {
  const { currentPermissionIdx } = await request.cache().helpers.status.get()
  const pageCache = Object.assign({}, await request.cache().helpers.page.get())
  const permission = await request.cache().helpers.page.getCurrentPermission(LICENCE_FOR.page)
  const licenceForHasChanged = (permission !== undefined) && permission.payload[LICENCE_FOR.page] !== request.payload[LICENCE_FOR.page]
  if (licenceForHasChanged) {
    pageCache.permissions[currentPermissionIdx] = {
      [LICENCE_FOR.page]: permission
    }
    await request.cache().helpers.page.set(pageCache)
  }
  return handler(request, h)
}
export default route
