import Boom from '@hapi/boom'

export default async (request, _h) => {
  const errorCode = parseInt(request.query.error)
  throw Boom.boomify(new Error(), { statusCode: errorCode })
}
