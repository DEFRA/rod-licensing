import { salesApi } from '@defra-fish/connectors-lib'

const matchingLicences = async contactInfo => {
  try {
    return await salesApi.getLicenceDetails(contactInfo)
  } catch (err) {
    console.error(`Error retrieving licence details for ${JSON.stringify(contactInfo)}`, err)
    return {}
  }
}

export const licenceDetailsService = async ({ firstName, lastName, birthDate, premises, postcode }) => {
  const response = await matchingLicences({ firstName, lastName, birthDate, premises, postcode })
  return response?.licences || []
}
