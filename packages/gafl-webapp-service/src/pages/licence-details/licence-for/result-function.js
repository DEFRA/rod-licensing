import { CommonResults, MultibuyForYou } from '../../../constants.js'
import { isMultibuyForYou } from '../../../handlers/multibuy-for-you-handler.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  const checkIsMultibuyForYou = await isMultibuyForYou(request)

  if (checkIsMultibuyForYou === true) {
    return MultibuyForYou.YES
  }

  return status.fromSummary ? CommonResults.SUMMARY : CommonResults.OK
}
