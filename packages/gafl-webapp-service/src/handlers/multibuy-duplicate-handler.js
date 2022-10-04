import _ from 'lodash'

export const checkDuplicates = async licences => {
  // break down parts of licence to check for duplication
  const licencesCheck = licences.map(licences => ({
    licenceHolder: licences.licenceHolder,
    type: licences.type,
    length: licences.length,
    start: licences.start
  }))

  let checkDuplicates = false
  for (let licence = 0; licence < licencesCheck.length; licence++) {
    for (let licenceCompare = licence + 1; licenceCompare < licencesCheck.length; licenceCompare++) {
      if (_.isEqual(licencesCheck[licence], licencesCheck[licenceCompare])) {
        checkDuplicates = true
        break
      }
    }
  }

  return checkDuplicates
}
