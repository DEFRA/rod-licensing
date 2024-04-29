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
    return getNotifyContent(permission, mssgs)
  } else {
    return {
      agree: mssgs.terms_conds_item_agree,
      title: mssgs.terms_conds_title,
      body: mssgs.terms_conds_body,
      bulletpointOne: mssgs.terms_conds_bulletpoint_1,
      bulletpointTwo: mssgs.terms_conds_bulletpoint_2,
      bulletpointThree: mssgs.terms_conds_bulletpoint_3,
      bulletpointFourPartOne: mssgs.terms_conds_bulletpoint_4_1,
      bulletpointFourLink: mssgs.terms_conds_bulletpoint_4_link,
      bulletpointFourPartTwo: mssgs.terms_conds_bulletpoint_4_2,
      bulletpointFive: mssgs.terms_conds_bulletpoint_5
    }
  }
}

const getNotifyContent = (permission, mssgs) => {
  return {
    agree: mssgs.terms_conds_notify_agree,
    title: permission.isLicenceForYou ? mssgs.terms_conds_title_notify_self : mssgs.terms_conds_title_notify_bobo,
    body: permission.isLicenceForYou ? mssgs.terms_conds_body_notify_self : mssgs.terms_conds_body_notify_bobo,
    bulletpointOne: permission.isLicenceForYou ? mssgs.terms_conds_bulletpoint_1_notify_self : mssgs.terms_conds_bulletpoint_1_notify_bobo,
    bulletpointTwo: permission.isLicenceForYou ? mssgs.terms_conds_bulletpoint_2_notify_self : mssgs.terms_conds_bulletpoint_2_notify_bobo,
    bulletpointThree: permission.isLicenceForYou
      ? mssgs.terms_conds_bulletpoint_3_notify_self
      : mssgs.terms_conds_bulletpoint_3_notify_bobo,
    bulletpointFourPartOne: permission.isLicenceForYou
      ? mssgs.terms_conds_bulletpoint_4_1_notify_self
      : mssgs.terms_conds_bulletpoint_4_1_notify_bobo,
    bulletpointFourLink: permission.isLicenceForYou
      ? mssgs.terms_conds_bulletpoint_4_link_notify_self
      : mssgs.terms_conds_bulletpoint_4_link_notify_bobo,
    bulletpointFourPartTwo: permission.isLicenceForYou
      ? mssgs.terms_conds_bulletpoint_4_2_notify_self
      : mssgs.terms_conds_bulletpoint_4_2_notify_bobo,
    bulletpointFive: permission.isLicenceForYou ? mssgs.terms_conds_bulletpoint_5_notify_self : mssgs.terms_conds_bulletpoint_5_notify_bobo,
    bulletpointSix: permission.isLicenceForYou ? mssgs.terms_conds_bulletpoint_6_notify_self : mssgs.terms_conds_bulletpoint_6_notify_bobo,
    bulletpointSixLink: permission.isLicenceForYou
      ? mssgs.terms_conds_bulletpoint_6_link_notify_self
      : mssgs.terms_conds_bulletpoint_6_link_notify_bobo
  }
}

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(TERMS_AND_CONDITIONS.page, TERMS_AND_CONDITIONS.uri, validator, nextPage, getData)
