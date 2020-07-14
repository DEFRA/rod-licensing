import { processFulfilment } from '../fulfilment-processor.js'
import config from '../config.js'
import { createPartFiles } from '../staging/create-part-files.js'
import { deliverFulfilmentFiles } from '../staging/deliver-fulfilment-files.js'

jest.mock('../config.js', () => ({
  initialise: jest.fn(async () => {})
}))
jest.mock('../staging/create-part-files.js')
jest.mock('../staging/deliver-fulfilment-files.js')

describe('fulfilment-processor', () => {
  it('processes fulfilment', async () => {
    await expect(processFulfilment()).resolves.toBeUndefined()
    expect(config.initialise).toHaveBeenCalled()
    expect(createPartFiles).toHaveBeenCalled()
    expect(deliverFulfilmentFiles).toHaveBeenCalled()
  })
})
