import { Binding } from '../../binding.js'
import { salesApi } from '@defra-fish/connectors-lib'

const permitIds = {}
const getPermitById = async itemId => {
  if (!permitIds[itemId]) {
    permitIds[itemId] = await salesApi.permits.find({ itemId: itemId })
  }
  return permitIds[itemId]
}

/**
 * Licence item identifier
 * @type {Binding}
 */
export const Permit = new Binding({
  element: 'ITEM_ID',
  transform: async context => {
    let permit
    if (context.value) {
      permit = await getPermitById(context.value)
    }
    return permit
  }
})

/**
 * Start date of the licence
 * @type {Binding}
 */
export const StartDate = new Binding({ element: 'START_DATE', transform: Binding.TransformTextOnly })

/**
 * Start time of the licence
 * @type {Binding}
 */
export const StartTime = new Binding({ element: 'START_TIME', transform: Binding.TransformTextOnly })
