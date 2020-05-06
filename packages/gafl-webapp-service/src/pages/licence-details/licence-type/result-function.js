import { LICENCE_TYPE } from '../../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TYPE.page)
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (payload['licence-type'] === 'salmon-and-sea-trout') {
    return status.fromSummary ? 'summary' : 'salmonAndSeaTrout'
  } else {
    const permission = await request.cache().helpers.transaction.getCurrentPermission()
    if (permission.licenceLength !== '12M') {
      return status.fromSummary ? 'summary' : 'troutAndCoarseTwoRod'
    } else {
      return 'troutAndCoarse'
    }
  }
}
