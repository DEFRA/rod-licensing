import pageRoute from '../../routes/page-route.js'
import * as mappings from '../../processors/mapping-constants.js'
import Joi from 'joi'
import { TERMS_AND_CONDITIONS, CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'

import GetDataRedirect from '../../handlers/get-data-redirect.js'

export const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (!status[LICENCE_SUMMARY.page]) {
    throw new GetDataRedirect(LICENCE_SUMMARY.uri)
  }

  if (!status[CONTACT_SUMMARY.page]) {
    throw new GetDataRedirect(CONTACT_SUMMARY.uri)
  }

  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    content: getContent(permission, request.i18n.getCatalog()),
    isSalmonAndSeaTrout: permission.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout'],
    paymentRequired: !!Number.parseInt(permission.permit.cost)
  }
}

const getContent = (permission, mssgs) => {
  return {
    agree: mssgs[`terms_conds_agree_notify_${permission.isLicenceForYou ? 'self' : 'bobo'}`],
    title: mssgs[`terms_conds_title_notify_${permission.isLicenceForYou ? 'self' : 'bobo'}`],
    body: mssgs[`terms_conds_body_notify_${permission.isLicenceForYou ? 'self' : 'bobo'}`],
    bulletpoint: getBulletpointContent(permission.isLicenceForYou, mssgs)
  }
}

const getBulletpointContent = (isLicenceForYou, mssgs) => ({
  bulletpointTwo: mssgs[`terms_conds_bulletpoint_2_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointThree: mssgs[`terms_conds_bulletpoint_3_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointFour: mssgs[`terms_conds_bulletpoint_4_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointFivePartOne: mssgs[`terms_conds_bulletpoint_5_1_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointFiveLink: mssgs[`terms_conds_bulletpoint_5_link_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointFivePartTwo: mssgs[`terms_conds_bulletpoint_5_2_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointSix: mssgs[`terms_conds_bulletpoint_6_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointSeven: mssgs[`terms_conds_bulletpoint_7_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointSevenLink: mssgs[`terms_conds_bulletpoint_7_link_notify_${isLicenceForYou ? 'self' : 'bobo'}`]
})

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(TERMS_AND_CONDITIONS.page, TERMS_AND_CONDITIONS.uri, validator, nextPage, getData)
