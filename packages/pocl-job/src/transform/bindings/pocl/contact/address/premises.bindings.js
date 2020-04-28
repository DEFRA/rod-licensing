import { Binding } from '../../../binding.js'

/**
 * PAF Value – Validated PO Box (if applicable) – only populated if included in data returned by PAF, not populated where address input manually
 *
 * @type {Binding}
 */
export const POBox = new Binding({ element: 'POBox', transform: Binding.TransformTextOnly })

/**
 * PAF Value - Validated “Sub premise name/ number” e.g. Flat B (if applicable) – only populated if included in data returned by PAF, not populated where address input manually
 *
 * @type {Binding}
 */
export const SubPrem = new Binding({ element: 'Subprem', transform: Binding.TransformTextOnly })

/**
 * PAF Value - Validated “Building (Premise) Name” e.g. Ocean Towers (if applicable)
 *   – only populated if included in data returned by PAF, not populated where address input manually
 *
 * @type {Binding}
 */
export const BuildName = new Binding({ element: 'Buildname', transform: Binding.TransformTextOnly })

/**
 * PAF Value - Validated “Building Number” e.g. 27 (if applicable) – only populated if included in data returned by PAF, not populated where address
 * input manually.  If the input <Buildnum> field contains non numeric (0-9) characters or is greater than 4 characters in length then append the
 * contents of <Buildnum> preceded by a space to the end of <Buildname> and return a null <Buildnum> field.
 * NB: If the rule defined above is true and <Buildname> is empty then <Buildnum> should not be preceded with a space.
 *
 * @type {Binding}
 */
export const BuildNum = new Binding({ element: 'Buildnum', transform: Binding.TransformTextOnly })

/**
 * Building Name/Number - only populated if address entered manually
 *
 * @type {Binding}
 */
export const Premises = new Binding({ element: 'Premises', transform: Binding.TransformTextOnly })
