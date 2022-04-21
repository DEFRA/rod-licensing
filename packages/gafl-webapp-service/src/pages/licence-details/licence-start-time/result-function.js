import commonResultHandler from '../../../handlers/multibuy-amend-handler.js'

export default async request => {
  const routeDirection = commonResultHandler(request)
  return routeDirection
}
