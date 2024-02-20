import { DISABILITY_CONCESSION } from '../../../uri.js'
import { addDisabled, removeDisabled } from '@defra-fish/business-rules-lib'
import { CONCESSION_PROOF } from '../../../processors/mapping-constants.js'
export const disabilityConcessionTypes = {
  pipDla: 'pip-dla',
  blueBadge: 'blue-badge',
  no: 'no'
}
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(DISABILITY_CONCESSION.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (payload['disability-concession'] === disabilityConcessionTypes.pipDla) {
    addDisabled(permission, CONCESSION_PROOF.NI, payload['ni-number'])
    Object.assign(permission, { licenceLength: '12M', licenceStartTime: '0' })
  } else if (payload['disability-concession'] === disabilityConcessionTypes.blueBadge) {
    addDisabled(permission, CONCESSION_PROOF.blueBadge, payload['blue-badge-number'])
    Object.assign(permission, { licenceLength: '12M', licenceStartTime: '0' })
  } else {
    removeDisabled(permission)
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}
