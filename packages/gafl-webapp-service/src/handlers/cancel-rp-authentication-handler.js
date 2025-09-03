import { CONTROLLER } from '../uri.js'

export default async (_request, h) => {
  console.log('cancel rp authenticate handler', h.redirectWithLanguageCode)
  return h.redirectWithLanguageCode(CONTROLLER.uri)
}
