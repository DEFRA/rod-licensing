import { Binding } from '../../../binding.js'

/**
 * PAF Value- Validated “Post town” e.g. Littlehampton
 * - only populated if included in data returned by PAF, not populated where address input manually
 *
 * @type {Binding}
 */
export const Town = new Binding({ element: 'Town', transform: Binding.TransformTextOnly })

/**
 * Town or City - - only populated if address entered manually
 * IF the input <TownCity> field is not null and is less than 2 characters in length THEN append space characters until length is equal to 2 characters.
 * IF the input <TownCity> field is null then the output <TownCity> field is also null
 *
 * @type {Binding}
 */
export const TownCity = new Binding({ element: 'TownCity', transform: Binding.TransformTextOnly })
