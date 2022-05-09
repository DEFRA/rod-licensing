import * as concessionHelper from './concession-helper.js'
import * as mappings from './mapping-constants.js'

export const licenceTypeDisplay = (request) => {
  const typesStrArr = []
  const numOfRodsStr = `up to ${request.numberOfRods} rods`
  console.log(request.concessions.concession)
  // Build the display string for the licence type
  if (concessionHelper.hasJunior(request)) {
    console.log(request)
    typesStrArr.push('Junior')
  } else if (concessionHelper.hasSenior(request)) {
    typesStrArr.push('Over 65')
  }

  typesStrArr.push(request.licenceType)
  typesStrArr.push(numOfRodsStr)
  return typesStrArr.join(', ')
}
// export const licenceTypeDisplay = async (request, permission) => {
//   // const typesStrArr = []
//   // console.log('request.i18n', request.i18n)
//   // const mssgs = request.i18n.getCatalog()
//   // console.log(mssgs)

//   // // Build the display string for the licence type
//   // if (concessionHelper.hasJunior(request)) {
//   //   typesStrArr.push('Junior')
//   // } else if (concessionHelper.hasSenior(request)) {
//   //   typesStrArr.push('Over 65')
//   // }

//   // typesStrArr.push(request.licenceType)

//   // if (request.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
//   //   typesStrArr.push(request.numberOfRods === '2' ? 'up to 2 rods' : 'up to 3 rods')
//   // }

//   // return typesStrArr.join(', ')
// }

export const licenceTypeAndLengthDisplay = (permission) => {
  switch (permission.licenceLength) {
    case '12M':
      return `${licenceTypeDisplay(permission)}, 12 months`
    case '8D':
      return `${licenceTypeDisplay(permission)}, 8 days`
    default:
      return `${licenceTypeDisplay(permission)}, 1 day`
  }
}

export const isPhysical = permission => permission.licenceLength === '12M' && !concessionHelper.hasJunior(permission)
