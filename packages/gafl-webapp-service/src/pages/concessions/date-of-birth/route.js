import { DATE_OF_BIRTH, LICENCE_FOR } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { dateOfBirthValidator } from '../../../schema/validators/validators.js'

const redirectToStartOfJourney = status => {
  if (!status[LICENCE_FOR.page]) {
    throw new GetDataRedirect(LICENCE_FOR.uri)
  }
}

export const getData = async request => {
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  redirectToStartOfJourney(status)

  return { isLicenceForYou }
}

export default pageRoute(DATE_OF_BIRTH.page, DATE_OF_BIRTH.uri, dateOfBirthValidator, nextPage, getData)
