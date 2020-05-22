import { Binding } from '../../../binding.js'

/**
 * PAF Value - Validated “Dependent locality” e.g. East Preston (if applicable) – only populated if included in data returned by PAF
 * - not populated where address input manually
 *
 * @type {Binding}
 */
export const Local = new Binding({ element: 'Local', transform: Binding.TransformTextOnly })

/**
 * PAF Value - Validated “Double dependent locality” e.g. Kingston Gorse (if applicable)
 * – only populated if included in data returned by PAF, not populated where address input manually
 *
 * @type {Binding}
 */
export const Deplocal = new Binding({ element: 'Deplocal', transform: Binding.TransformTextOnly })

/**
 * Address line 2 - only populated if address entered manually
 *
 * @type {Binding}
 */
export const ContAddress = new Binding({ element: 'ContAddress', transform: Binding.TransformTextOnly })
