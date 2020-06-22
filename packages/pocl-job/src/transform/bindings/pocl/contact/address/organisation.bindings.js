import { Binding } from '../../../binding.js'

/**
 * PAF Value – Organisation Name (if applicable) – only populated if included in data returned by PAF, not populated where address input manually
 *
 * @type {Binding}
 */
export const Org = new Binding({ element: 'Org', transform: Binding.TransformTextOnly })
