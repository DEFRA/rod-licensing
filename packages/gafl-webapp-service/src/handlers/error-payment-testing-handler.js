import Boom from '@hapi/boom'

export default async (request, _h) => {
  const origin = { step: request.query.origin }
  const badImplementationError = Boom.boomify(new Error(), { statusCode: 500 })
  badImplementationError.output.payload.origin = origin
  throw badImplementationError
}
