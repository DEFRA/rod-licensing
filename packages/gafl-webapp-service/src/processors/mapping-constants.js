/**
 * These constants are used to map the internal (front end) representation of data to the API representation
 */
const HOW_CONTACTED = { email: 'Email', text: 'Text', letter: 'Letter', none: 'Prefer not to be contacted' }
const CONCESSION = { SENIOR: 'Senior', JUNIOR: 'Junior', DISABLED: 'Disabled' }
const CONCESSION_PROOF = { none: 'No Proof', blueBadge: 'Blue Badge', NI: 'National Insurance Number' }
const LICENCE_TYPE = { 'trout-and-coarse': 'Trout and coarse', 'salmon-and-sea-trout': 'Salmon and sea trout' }
const DATA_SOURCE = { web: 'Web Sales', telesales: 'Telesales' }

export { HOW_CONTACTED, CONCESSION, CONCESSION_PROOF, LICENCE_TYPE, DATA_SOURCE }
