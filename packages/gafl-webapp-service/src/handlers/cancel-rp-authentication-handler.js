import { CONTROLLER } from '../uri.js'

export default async (request, h) => {
  console.log('cancel rp authenticate handler', h.redirectWithLanguageCode)
  return h.redirectWithLanguageCode(CONTROLLER.uri)
}
