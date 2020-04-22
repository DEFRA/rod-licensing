import { LICENCE_TYPE } from '../../../constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TYPE.page)
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (payload['licence-type'] === 'salmon-and-sea-trout') {
    return status.fromSummary ? 'summary' : 'salmonAndSeaTrout'
  } else {
    return 'troutAndCoarse'
  }
}
