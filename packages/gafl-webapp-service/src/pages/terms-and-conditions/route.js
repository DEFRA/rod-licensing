import pageRoute from '../../routes/page-route.js'
import * as mappings from '../../processors/mapping-constants.js'
import Joi from 'joi'
import { TERMS_AND_CONDITIONS, CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'
import { FULFILMENT_SWITCHOVER_DATE } from '@defra-fish/business-rules-lib'
import moment from 'moment'

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
  const afterFulfilmentSwitchover = moment.utc().isAfter(FULFILMENT_SWITCHOVER_DATE)

  return {
    content: getContent(afterFulfilmentSwitchover, permission, request.i18n.getCatalog()),
    isSalmonAndSeaTrout: permission.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout'],
    paymentRequired: !!Number.parseInt(permission.permit.cost),
    afterFulfilmentSwitchover
  }
}

const getContent = (afterFulfilmentSwitchover, permission, mssgs) => {
  if (afterFulfilmentSwitchover) {
    return {
      agree: mssgs.terms_conds_notify_agree,
      title: mssgs[`terms_conds_title_notify_${permission.isLicenceForYou ? 'self' : 'bobo'}`],
      body: mssgs[`terms_conds_body_notify_${permission.isLicenceForYou ? 'self' : 'bobo'}`],
      bulletpoint: getBulletpointContent(permission.isLicenceForYou, mssgs)
    }
  } else {
    return {
      agree: mssgs.terms_conds_item_agree,
      title: mssgs.terms_conds_title,
      body: mssgs.terms_conds_body
    }
  }
}

const getBulletpointContent = (isLicenceForYou, mssgs) => ({
  bulletpointOne: mssgs[`terms_conds_bulletpoint_1_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointTwo: mssgs[`terms_conds_bulletpoint_2_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointThree: mssgs[`terms_conds_bulletpoint_3_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointFourPartOne: mssgs[`terms_conds_bulletpoint_4_1_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointFourLink: mssgs[`terms_conds_bulletpoint_4_link_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointFourPartTwo: mssgs[`terms_conds_bulletpoint_4_2_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointFive: mssgs[`terms_conds_bulletpoint_5_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointSix: mssgs[`terms_conds_bulletpoint_6_notify_${isLicenceForYou ? 'self' : 'bobo'}`],
  bulletpointSixLink: mssgs[`terms_conds_bulletpoint_6_link_notify_${isLicenceForYou ? 'self' : 'bobo'}`]
})

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(TERMS_AND_CONDITIONS.page, TERMS_AND_CONDITIONS.uri, validator, nextPage, getData)
