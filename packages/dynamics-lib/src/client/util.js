const stringSubstitutions = {
  '%': '%25',
  '+': '%2B',
  '/': '%2F',
  '?': '%3F',
  '#': '%23',
  '&': '%26',
  "'": "''"
}
const escapeODataStringValueRegex = new RegExp(`[${Object.keys(stringSubstitutions).join('')}]`, 'g')

/**
 * Sanitise a string value used in an ODATA query
 * @param {string|number|boolean} value the value to be sanitised
 * @returns {string} the sanitised string
 */
export const escapeODataStringValue = value => String(value).replace(escapeODataStringValueRegex, char => stringSubstitutions[char])

export const generateDobId = dob => getRandomInt(10, 99) + dob.replace(/-/g, '') + getRandomInt(1000, 9999)
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
