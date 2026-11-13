import pageRoute from '../../../routes/page-route.js'
import { EXISTING_LICENCE_DETAILS } from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'
import { displayStartTime, displayEndTime } from '../../../processors/date-and-time-display.js'
import { licenceTypeDisplay, licenceSummaryRows } from '../../../processors/licence-type-display.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

const getAgeConcessionText = (permission, catalog) => {
  if (concessionHelper.hasSenior(permission)) {
    return catalog.age_senior_concession
  }
  if (concessionHelper.hasJunior(permission)) {
    return catalog.age_junior_concession
  }
  return ''
}

export const getData = async request => {
  const [permission] = (await request.cache().helpers.existingPermissions.get()).permissions
  const startTimeString = displayStartTime(request, permission)
  const endTimeString = displayEndTime(request, permission)
  const catalog = request.i18n.getCatalog()
  const data = {
    permission,
    startTimeString,
    endTimeString,
    disabled: concessionHelper.hasDisabled(permission),
    ageConcession: concessionHelper.getAgeConcession(permission),
    ageConcessionText: getAgeConcessionText(permission, catalog),
    licenceTypeStr: licenceTypeDisplay(permission, catalog)
  }
  data.licenceSummaryRows = licenceSummaryRows(catalog, data)
  return data
}

export default pageRoute(EXISTING_LICENCE_DETAILS.page, EXISTING_LICENCE_DETAILS.uri, null, nextPage, getData)