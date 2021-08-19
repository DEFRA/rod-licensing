import pluralize from 'pluralize'
import { generateDobId } from '@defra-fish/dynamics-lib'

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
        equipment: getEquipment(permit),
        duration: getDuration(permit),
        cost: permit.cost,
        paymentCurrency: 'GBP',
        startDateAndTime: permission.startDate,
        expiryDateAndTime: permission.endDate,
        issueDateAndTime: permission.issueDate,
        licenceNumber: permission.referenceNumber.substring(permission.referenceNumber.indexOf('-') + 1)
      },
      holder: {
        dateOfBirth: {
          id: licensee.obfuscatedDob ? licensee.obfuscatedDob : generateDobId(licensee.birthDate),
          value: licensee.birthDate
        },
        name: { firstName: licensee.firstName, surname: licensee.lastName },
        address: {
          ...(licensee.organisation && { organisation: licensee.organisation }),
          premises: licensee.premises,
          ...(licensee.street && { street: licensee.street }),
          ...(licensee.locality && { locality: licensee.locality }),
          town: licensee.town,
          postcode: licensee.postcode,
          country: licensee.country?.label
        }
      }
    })
    sep = ',\n    '
  }
}

const durations = { D: 'day', M: 'month', Y: 'year' }
const getDuration = permit => pluralize(durations[permit.durationDesignator.description], permit.durationMagnitude, true)
const getEquipment = permit => (permit.numberOfRods > 1 ? `Up to ${permit.numberOfRods} rods` : `${permit.numberOfRods} rod`)
