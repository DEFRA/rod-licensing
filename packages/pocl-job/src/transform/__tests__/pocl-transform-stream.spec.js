import Project from '../../project.cjs'
import { transform } from '../pocl-transform-stream.js'
import { Transaction } from '../bindings/pocl/transaction/transaction.bindings.js'

jest.mock('../bindings/pocl/transaction/transaction.bindings.js', () => ({
  Transaction: {
    element: 'REC',
    transform: jest.fn(async () => ({}))
  }
}))

describe('pocl transform stream', () => {
  it('transforms POCL XML to staging JSON', async () => {
    let numberOfRecords = 0
    await transform(`${Project.root}/src/__mocks__/test-2-records.xml`, async function * (source) {
      for await (const chunk of source) {
        numberOfRecords++
        yield chunk
      }
    })
    expect(numberOfRecords).toBe(2)
  })

  it('handles transformation errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    const testError = new Error('Test transform error')
    Transaction.transform.mockRejectedValue(testError)
    await expect(
      transform(`${Project.root}/src/__mocks__/test-2-records.xml`, async function * (source) {
        for await (const chunk of source) {
          yield chunk
        }
      })
    ).rejects.toThrow(testError)
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
