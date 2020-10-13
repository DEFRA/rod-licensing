import { Binding } from '../../binding.js'
import { salesApi } from '@defra-fish/connectors-lib'

const permitIds = {}
const getPermitId = async itemId => {
  if (!permitIds[itemId]) {
    permitIds[itemId] = (await salesApi.permits.find({ itemId: itemId }))?.id
  }
  return permitIds[itemId]
}

/**
 * Licence item identifier
 * @type {Binding}
 */
export const ItemId = new Binding({
  element: 'ITEM_ID',
  transform: async context => {
    let permitId
    if (context.value) {
      permitId = await getPermitId(context.value)
    }
    return permitId
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
