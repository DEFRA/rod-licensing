import { Binding } from '../../../binding.js'

/**
 * PAF Value - Validated “Postcode” e.g. RG30 4TU - only populated if included in data returned by PAF, not populated where address input manually
 * Remove any space characters from the input field
 *
 * @type {Binding}
 */
export const Postcode = new Binding({ element: 'Postcode', transform: Binding.TransformTextOnly })

/**
 * Postcode - only populated if address entered manually. Remove any space characters from the input field
 *
 * @type {Binding}
 */
export const PostcodeZip = new Binding({ element: 'PostcodeZip', transform: Binding.TransformTextOnly })
