import { Binding } from '../../../binding.js'

/**
 * Country - only populated if address entered manually
 *
 * @type {Binding}
 */
export const Country = new Binding({ element: 'Country', transform: context => Binding.TransformTextOnly(context) || 'GB' })
