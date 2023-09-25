/**
 * Functionality for the pricing boxes on the right hand side of the type and lengths pages
 */
import { LICENCE_TYPE } from '../uri.js'
import { getPermitsJoinPermitConcessions } from './filter-permits.js'
import * as concessionHelper from '../processors/concession-helper.js'
import * as constants from './mapping-constants.js'
import moment from 'moment'
const NO_SHORT = 'no-short'

/**
 * Filters for permitsJoinPermitConcessions
 * @param type
 * @param lenStr
 * @returns {(function(*): boolean)|(function(*): boolean)|(function(*): boolean)}
 */
const byLength = lenStr => arr => `${arr.durationMagnitude}${arr.durationDesignator.description}` === lenStr

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

const getLicenceCategory = permit => {
  if (permit.concessions.some(c => c.name.toLowerCase() === 'junior')) {
    return 'junior'
  } else if (permit.concessions.length > 0) {
    return 'concession'
  }
  return 'full'
}

const getByTypeArray = (permission, permits) => {
  const licenceType = {
    concession: { byType: {} },
    full: { byType: {} },
    junior: { byType: {} }
  }
  for (const permit of permits) {
    const category = getLicenceCategory(permit)
    const typeKey = `${permit.permitSubtype.label.toLowerCase().replaceAll(' ', '-')}${
      permit.permitSubtype.description === 'C' ? `-${permit.numberOfRods}-rod` : ''
    }`
    const durationCode = `${permit.durationMagnitude}${permit.durationDesignator.description}`
    if (!licenceType[category].byType?.[typeKey]?.[durationCode]) {
      if (!licenceType[category].byType[typeKey]) {
        licenceType[category].byType[typeKey] = {}
      }
      licenceType[category].byType[typeKey][durationCode] = {
        cost: formatCost(getPermitCost(permission, permit)),
        concessions: permit.concessions.length > 0 && durationCode === '12M'
      }
    }
  }
  for (const category of Object.keys(licenceType)) {
    for (const type of Object.keys(licenceType[category].byType)) {
      if (Object.keys(licenceType[category].byType[type]).length === 1) {
        licenceType[category].byType[type].msg = NO_SHORT
      }
    }
  }

  return licenceType
}

/**
 * Fetch the pricing detail - this is modified by the users concessions
 * @param page
 * @param request
 * @returns  {Promise<{byLength: {}}|{byType: {}}>}
 */
export const pricingDetail = async (page, permission) => {
  const permitsJoinPermitConcessions = await getPermitsJoinPermitConcessions()

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

  if (page === LICENCE_TYPE.page) {
    const byTypeArray = getByTypeArray(permission, permitsJoinPermitConcessions)
    if (permission.concessions.some(c => c.type.toLowerCase() === 'junior')) {
      return byTypeArray.junior
    } else if (permission.concessions.length > 0) {
      return byTypeArray.concession
    }
    return byTypeArray.full
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
            [c.len]: { total: { cost: formatCost(c.cost), concessions: c.concessions } }
          }),
          {}
        )
    }
  }
}
