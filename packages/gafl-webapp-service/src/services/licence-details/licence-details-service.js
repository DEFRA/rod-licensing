import { salesApi } from '@defra-fish/connectors-lib'

export default async ({ firstName, lastName, birthDate, postcode }) => {
  let response
  try {
    response = await salesApi.getLicenceDetails(firstName, lastName, birthDate, postcode)
  } catch (err) {
    console.error(`Error retrieving licence details for ${JSON.stringify({ firstName, lastName, birthDate, postcode })}`, err)
    return []
  }

  return response?.licences || []
}
