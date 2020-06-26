import { LICENCE_TYPE } from '../../../uri.js'
import { CommonResults } from '../../../constants.js'

export const licenceTypeResults = {
  TROUT_AND_COARSE: 'trout-and-coarse',
  TROUT_AND_COARSE_2_ROD: 'trout-and-coarse-2r',
  SALMON_AND_SEA_TROUT: 'salmon-and-sea-trout'
}

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TYPE.page)
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (payload['licence-type'] === 'salmon-and-sea-trout') {
    return status.fromSummary ? CommonResults.SUMMARY : licenceTypeResults.SALMON_AND_SEA_TROUT
  } else {
    const permission = await request.cache().helpers.transaction.getCurrentPermission()
    if (permission.licenceLength !== '12M') {
      return status.fromSummary ? CommonResults.SUMMARY : licenceTypeResults.TROUT_AND_COARSE_2_ROD
    } else {
      return licenceTypeResults.TROUT_AND_COARSE
    }
  }
}
