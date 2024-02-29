/**
 * Functionality for the pricing boxes on the right hand side of the type and lengths pages
 */
import { licenseTypes } from '../pages/licence-details/licence-type/route.js'
import { LICENCE_TYPE } from '../uri.js'
import { getPermitsJoinPermitConcessions } from './find-permit.js'
import * as concessionHelper from '../processors/concession-helper.js'
import * as constants from './mapping-constants.js'
import moment from 'moment'
const NO_SHORT = 'no-short'
const PAYMENT_EDGE_CASE = 'payment-edge-case'

/**
 * Filters for permitsJoinPermitConcessions
 * @param type
 * @param lenStr
 * @returns {(function(*): boolean)|(function(*): boolean)|(function(*): boolean)}
 */
const byLength = lenStr => arr => `${arr.durationMagnitude}${arr.durationDesignator.description}` === lenStr

const byType = type => {
  if (type === licenseTypes.troutAndCoarse2Rod) {
    return arr => arr.permitSubtype.label === constants.LICENCE_TYPE['trout-and-coarse'] && arr.numberOfRods === 2
  } else if (type === licenseTypes.troutAndCoarse3Rod) {
    return arr => arr.permitSubtype.label === constants.LICENCE_TYPE['trout-and-coarse'] && arr.numberOfRods === 3
  } else {
    return arr => arr.permitSubtype.label === constants.LICENCE_TYPE['salmon-and-sea-trout'] && arr.numberOfRods === 1
  }
}

const byTypeAndLength = (type, lenStr) => arr => byType(type)(arr) && byLength(lenStr)(arr)
const byConcessions = concessions => p =>
  p.concessions.every(c => concessions.find(pc => c.name === pc)) && concessions.length === p.concessions.length
const getPermitCost = (permission, permit) =>
  moment(permission.licenceStartDate).isSameOrAfter(permit.newCostStartDate) ? permit.newCost : permit.cost

/**
 * The pages needs to know the prices, if a concession has been applied and if the product is available at all.
 * This is true independent of the filtering context
 * @param permitWithConcessions
 * @param permitWithoutConcessions
 * @param len
 * @param permission
 * @returns {{avail: boolean, len: *}|{avail: boolean, concessions: (boolean|*), cost: *, len: *}|{avail: boolean, concessions: boolean, cost: *, len: *}}
 */
const resultTransformer = (permitWithConcessions, permitWithoutConcessions, len, permission) => {
  if (permitWithConcessions) {
    return {
      len,
      cost: getPermitCost(permission, permitWithConcessions),
      concessions: permitWithoutConcessions.cost > permitWithConcessions.cost || concessionHelper.hasJunior(permission),
      avail: true
    }
  }

  if (permitWithoutConcessions) {
    return {
      len,
      cost: getPermitCost(permission, permitWithoutConcessions),
      concessions: false,
      avail: true
    }
  }

  return { len, avail: false }
}

const formatCost = cost => (Number.isInteger(cost) ? String(cost) : cost.toFixed(2))

export const shouldDisplayPriceChangePaymentWarningMessage = (concessions) => {
  const now = moment()
  if (concessions.includes('Junior')) {
    return false
  }
  const startRange = moment('2024-03-30T23:59:00Z')
  const endRange = moment('2024-04-01T00:01:00Z')

  return now.isBetween(startRange, endRange, null, '[]')
}

const applyConcessions = permission => {
  const userConcessions = []
  if (concessionHelper.hasJunior(permission)) {
    userConcessions.push(constants.CONCESSION.JUNIOR)
  }

  if (concessionHelper.hasSenior(permission)) {
    userConcessions.push(constants.CONCESSION.SENIOR)
  }

  if (concessionHelper.hasDisabled(permission)) {
    userConcessions.push(constants.CONCESSION.DISABLED)
  }
  return userConcessions
}

/**
 * Fetch the pricing detail - this is modified by the users concessions
 * @param page
 * @param request
 * @returns  {Promise<{byLength: {}}|{byType: {}}>}
 */
export const pricingDetail = async (page, permission) => {
  const permitsJoinPermitConcessions = await getPermitsJoinPermitConcessions()
  const userConcessions = applyConcessions(permission)

  if (page === LICENCE_TYPE.page) {
    const permitsJoinPermitConcessionsFilteredByUserConcessions = permitsJoinPermitConcessions.filter(byConcessions(userConcessions))
    const permitsJoinPermitConcessionsFilteredWithoutConcessions = permitsJoinPermitConcessions.filter(
      byConcessions(concessionHelper.hasJunior(permission) ? [constants.CONCESSION.JUNIOR] : [])
    )

    return {
      byType: Object.values(licenseTypes)
        .map(licenceType => {
          const filtered = ['12M', '8D', '1D']
            .map(len =>
              resultTransformer(
                permitsJoinPermitConcessionsFilteredByUserConcessions.find(byTypeAndLength(licenceType, len)),
                permitsJoinPermitConcessionsFilteredWithoutConcessions.find(byTypeAndLength(licenceType, len)),
                len,
                permission
              )
            )
            .filter(e => e.avail)
            .reduce(
              (a, c) => ({
                ...a,
                [c.len]: { cost: formatCost(c.cost), concessions: c.concessions }
              }),
              {}
            )
          return {
            [licenceType]: Object.assign(
              filtered,
              Object.keys(filtered).length < 3 ? { msg: NO_SHORT } : {},
              shouldDisplayPriceChangePaymentWarningMessage(userConcessions) ? { payment_msg: PAYMENT_EDGE_CASE } : {}
            )
          }
        })
        .reduce((a, c) => Object.assign(c, a))
    }
  } else {
    // Licence length page
    const permitsJoinPermitConcessionsFilteredByUserConcessions = permitsJoinPermitConcessions
      .filter(p => p.permitSubtype.label === permission.licenceType)
      .filter(r => String(r.numberOfRods) === permission.numberOfRods)
      .filter(byConcessions(userConcessions))

    const permitsJoinPermitConcessionsFilteredWithoutConcessions = permitsJoinPermitConcessions
      .filter(p => p.permitSubtype.label === permission.licenceType)
      .filter(r => String(r.numberOfRods) === permission.numberOfRods)
      .filter(byConcessions(concessionHelper.hasJunior(permission) ? [constants.CONCESSION.JUNIOR] : []))

    return {
      byLength: ['12M', '8D', '1D']
        .map(len =>
          resultTransformer(
            permitsJoinPermitConcessionsFilteredByUserConcessions.find(byLength(len)),
            permitsJoinPermitConcessionsFilteredWithoutConcessions.find(byLength(len)),
            len,
            permission
          )
        )
        .filter(e => e.avail)
        .reduce(
          (a, c) => ({
            ...a,
            [c.len]: {
              total: { cost: formatCost(c.cost), concessions: c.concessions },
              ...(shouldDisplayPriceChangePaymentWarningMessage(userConcessions) ? { payment_msg: PAYMENT_EDGE_CASE } : {})
            }
          }),
          {}
        )
    }
  }
}
