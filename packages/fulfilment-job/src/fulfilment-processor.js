import config from './config.js'
import { createPartFiles } from './staging/create-part-files.js'
import { deliverFulfilmentFiles } from './staging/deliver-fulfilment-files.js'
export const processFulfilment = async () => {
  await config.initialise()
  await createPartFiles()
  await deliverFulfilmentFiles()
}
