import { isStaticResource } from './../session-cache/session-manager.js'
import url from 'url'

export const languageHandler = (request, h) => {
  if (!isStaticResource(request)) {
    const welsh = '?lang=cy'
    if (request.info.referrer) {
      const referrer = new url.URL(request.info.referrer)
      if (referrer?.search?.includes(welsh)) {
        if (!request?.url?.search?.includes(welsh)) {
          request.setUrl(request.url.href + welsh)
        }
      }
    }
  }

  return h.continue
}
