import { Binding } from '../../../binding.js'

/**
 * PAFValue  - Validated “Dependent thoroughfare” e.g. Gorse View (if applicable) – only populated if included in data returned by PAF, not populated where address input manually
 *
 * @type {Binding}
 */
export const Depthoro = new Binding({ element: 'Depthoro', transform: Binding.TransformTextOnly })

/**
 * PAF Value - Validated “Thoroughfare “ e.g. Peak Lane (if applicable) – only populated if included in data returned by PAF, not populated where address input manually
 *
 * @type {Binding}
 */
export const Thoro = new Binding({ element: 'Thoro', transform: Binding.TransformTextOnly })

/**
 * Address line 1 - only populated if address entered manually
 *
 * @type {Binding}
 */
export const Address = new Binding({ element: 'Address', transform: Binding.TransformTextOnly })
