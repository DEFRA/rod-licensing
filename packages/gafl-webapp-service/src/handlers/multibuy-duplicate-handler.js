export const hasDuplicates = async licencesArray => {
  const licences = licencesArray.map(licence => `${licence.licenceHolder}${licence.type}${licence.length}${licence.start}`)
  const duplicates = licences.filter(licenceChecking => {
    return licences.filter(licenceComparing => licenceChecking === licenceComparing).length > 1
  })
  return duplicates.length > 1
}
