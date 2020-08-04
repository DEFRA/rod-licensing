import { retrieveGlobalOptionSets } from '@defra-fish/dynamics-lib'

export const FULFILMENT_REQUEST_STATUS_OPTIONSET = 'defra_fulfilmentrequeststatus'
export const FULFILMENT_FILE_STATUS_OPTIONSET = 'defra_fulfilmentrequestfilestatus'

/**
 * Retrieve a GlobalOptionSetDefinition for the given name and label
 *
 * @param {string} optionSetName The name of the option set to retrieve an entry from
 * @param {string} label The label of the entry to retrieve
 * @returns {Promise<GlobalOptionSetDefinition>}
 */
export const getOptionSetEntry = async (optionSetName, label) => {
  const statuses = await retrieveGlobalOptionSets().cached()
  return Object.values(statuses[optionSetName].options).find(o => o.label === label)
}
