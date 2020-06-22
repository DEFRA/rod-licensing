/**
 * @typedef FulfilmentDataEntry
 * @property {!FulfilmentRequest} fulfilmentRequest The Fulfilment Request entity
 * @property {!Permission} permission The Permission entity related to the fulfilment request
 * @property {!Contact} licensee The Contact entity related to the fulfilment request
 * @property {!Permit} permit The Permit entity related to the fulfilment request
 */

/**
 * Fulfilment data transformer async generator function to populate records in the fulfilment part file
 *
 * @param {AsyncIterable<FulfilmentDataEntry>} source The pipeline source
 * @returns {AsyncGenerator<string, void, *>}
 */
export async function * fulfilmentDataTransformer (source) {
  let sep = '    '
  for await (const { permission, licensee, permit } of source) {
    yield sep
    yield JSON.stringify({
      licence: {
        type: permit.permitType.label,
        subtype: permit.permitSubtype.label,
        description: permit.description,
        equipment: `${permit.numberOfRods} rod(s)`,
        duration: `${permit.durationMagnitude} ${permit.durationDesignator.label}`,
        cost: permit.cost,
        paymentCurrency: 'GBP',
        startDateAndTime: permission.startDate,
        expiryDateAndTime: permission.endDate,
        issueDateAndTime: permission.issueDate,
        licenceNumber: permission.referenceNumber.substring(permission.referenceNumber.indexOf('-') + 1)
      },
      holder: {
        dateOfBirth: { id: generateDobId(licensee.birthDate), value: licensee.birthDate },
        name: { firstName: licensee.firstName, surname: licensee.lastName },
        address: {
          ...(licensee.organisation && { organisation: licensee.organisation }),
          premises: licensee.premises,
          ...(licensee.street && { street: licensee.street }),
          ...(licensee.locality && { locality: licensee.locality }),
          town: licensee.town,
          postcode: licensee.postcode,
          country: licensee.country.label
        }
      }
    })
    sep = ',\n    '
  }
}

const generateDobId = dob => getRandomInt(10, 99) + dob.replace(/-/g, '') + getRandomInt(1000, 9999)
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
