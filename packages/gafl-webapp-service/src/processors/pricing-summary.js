/**
 * Functionality for the pricing boxes on the right hand side of the type and lengths pages
 */
import { licenseTypes } from '../pages/licence-details/licence-type/route.js'
import { LICENCE_TYPE } from '../uri.js'
import { getPermitsJoinPermitConcessions } from './filter-permits.js'
import { displayPermissionPrice } from './price-display.js'
import * as concessionHelper from '../processors/concession-helper.js'
import * as constants from './mapping-constants.js'
const NO_SHORT = 'no-short'

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

/**
 * The pages needs to know the prices, if a concession has been applied and if the product is available at all.
 * This is true independent of the filtering context
 * @param permitWithConcessions
 * @param permitWithOutConcessions
 * @param length
 * @param permission
 * @param label
 * @returns {{avail: boolean, length: *}|{avail: boolean, concessions: (boolean|*), cost: *, len: *}|{avail: boolean, concessions: boolean, cost: *, len: *}}
 */
const resultTransformer = (permitWithConcessions, permitWithoutConcessions, length, permission, labels) => {
  if (permitWithConcessions) {
    const permissionPrice = {
      startDate: permission.licenceStartDate,
      permit: permitWithConcessions
    }

    return {
      length,
      cost: displayPermissionPrice(permissionPrice, labels),
      concessions: permitWithoutConcessions.cost > permitWithConcessions.cost || concessionHelper.hasJunior(permission)
    }
  }

  if (permitWithoutConcessions) {
    const permissionPrice = {
      startDate: permission.licenceStartDate,
      permit: permitWithoutConcessions
    }

    return {
      length,
      cost: displayPermissionPrice(permissionPrice, labels),
      concessions: false
    }
  }
}

/**
 * Fetch the pricing detail - this is modified by the users concessions
 * @param page
 * @param request
 * @returns  {Promise<{byLength: {}}|{byType: {}}>}
 */
export const pricingDetail = async (page, permission, labels) => {
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
    const permitsJoinPermitConcessionsFilteredByUserConcessions = permitsJoinPermitConcessions.filter(byConcessions(userConcessions))
    const permitsJoinPermitConcessionsFilteredWithoutConcessions = permitsJoinPermitConcessions.filter(
      byConcessions(concessionHelper.hasJunior(permission) ? [constants.CONCESSION.JUNIOR] : [])
    )

    return {
      byType: Object.values(licenseTypes).reduce((selectors, licenceType) => {
        const filtered = ['12M', '8D', '1D'].reduce((obj, length) => {
          const transformed = resultTransformer(
            permitsJoinPermitConcessionsFilteredByUserConcessions.find(byTypeAndLength(licenceType, length)),
            permitsJoinPermitConcessionsFilteredWithoutConcessions.find(byTypeAndLength(licenceType, length)),
            length,
            permission,
            labels
          )
          if (transformed) {
            obj[length] = transformed
          }
          return obj
        }, {})

        if (Object.keys(filtered).length < 3) {
          filtered.msg = NO_SHORT
        }

        return { ...selectors, [licenceType]: filtered }
      }, {})
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
      byLength: ['12M', '8D', '1D'].reduce((obj, length) => {
        const transformed = resultTransformer(
          permitsJoinPermitConcessionsFilteredByUserConcessions.find(byLength(length)),
          permitsJoinPermitConcessionsFilteredWithoutConcessions.find(byLength(length)),
          length,
          permission,
          labels
        )
        if (transformed) {
          obj[length] = {
            total: {
              cost: transformed.cost,
              concessions: transformed.concessions
            }
          }
        }
        return obj
      }, {})
    }
  }
}
