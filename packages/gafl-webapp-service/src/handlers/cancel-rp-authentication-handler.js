import { CONTROLLER } from '../uri.js'

export default async (request, h) => {
  return h.redirectWithLanguageCode(CONTROLLER.uri)
}
