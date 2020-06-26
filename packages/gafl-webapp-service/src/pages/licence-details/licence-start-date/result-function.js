import { CommonResults } from '../../../constants.js'

export const licenceStartDate = {
  AND_CONTINUE: 'and-continue',
  AND_START_TIME: 'and-start-time'
}

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()
  if (permission.licenceLength === '12M') {
    return status.fromSummary ? CommonResults.SUMMARY : licenceStartDate.AND_CONTINUE
  } else {
    return licenceStartDate.AND_START_TIME
  }
}
