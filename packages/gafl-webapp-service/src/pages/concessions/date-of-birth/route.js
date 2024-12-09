import { DATE_OF_BIRTH, LICENCE_FOR } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { dateOfBirthValidator, getDateErrorFlags } from '../../../schema/validators/validators.js'

const redirectToStartOfJourney = status => {
  if (!status[LICENCE_FOR.page]) {
    throw new GetDataRedirect(LICENCE_FOR.uri)
  }
}

export const getData = async request => {
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()
  const page = await request.cache().helpers.page.getCurrentPermission(DATE_OF_BIRTH.page)
  const pageData = { isLicenceForYou, ...getDateErrorFlags(page?.error) }

  redirectToStartOfJourney(status)

  if (page?.error) {
    const [errorKey] = Object.keys(page.error)
    const errorValue = page.error[errorKey]
    pageData.error = { errorKey, errorValue }
  }
  return pageData
}

export default pageRoute(DATE_OF_BIRTH.page, DATE_OF_BIRTH.uri, dateOfBirthValidator, nextPage, getData)
