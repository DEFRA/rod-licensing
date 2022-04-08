import stream from 'stream'
import streamHelper from '../streamHelper.js'

jest.mock('stream')
describe('Streamhelper', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([
    ['abc', 123],
    [[], {}, /[A-Z]*/]
  ])('passes through any and all arguments (caller needs to know how to call stream.pipeline)', (...args) => {
    streamHelper.pipelinePromise(...args)
    expect(stream.pipeline).toHaveBeenCalledWith(...args, expect.any(Function))
  })

  it('checks stream finished with readable set to false', () => {
    const s = new stream.PassThrough()
    streamHelper.pipelinePromise(s)
    expect(stream.finished).toHaveBeenCalledWith(s, expect.objectContaining({ readable: false }), expect.any(Function))
  })

  it('promise resolves when pipeline callback invoked', () => {
    const p = makeQueryablePromise(streamHelper.pipelinePromise())
    const {
      pipeline: {
        mock: {
          calls: [[callbackHandler]]
        }
      }
    } = stream
    callbackHandler()
    expect(p.isFulfilled).toBeTruthy()
  })

  it('promise rejects when pipeline callback invoked with error argument', () => {
    const p = makeQueryablePromise(streamHelper.pipelinePromise())
    const {
      pipeline: {
        mock: {
          calls: [[callbackHandler]]
        }
      }
    } = stream
    callbackHandler(new Error("Trouble at t' mill"))
    expect(p.isRejected).toBeTruthy()
  })

  it('promise resolves when finished callback invoked', () => {
    const p = makeQueryablePromise(streamHelper.pipelinePromise())
    const callbackHandler = stream.finished.mock.calls[0][2]
    callbackHandler()
    expect(p.isFulfilled).toBeTruthy()
  })

  it('promise rejects when finshed callback invoked with error argument', () => {
    const p = makeQueryablePromise(streamHelper.pipelinePromise())
    const callbackHandler = stream.finished.mock.calls[0][2]
    callbackHandler(new Error("Trouble at t' mill"))
    expect(p.isRejected).toBeTruthy()
  })
})
const makeQueryablePromise = promise => {
  // Don't modify any promise that has been already modified.
  if (promise.isFulfilled) return promise

  // Set initial state
  let isPending = true
  let isRejected = false
  let isFulfilled = false

  // Observe the promise, saving the fulfillment in a closure scope.
  const result = promise.then(
    v => {
      isFulfilled = true
      isPending = false
      return v
    },
    e => {
      isRejected = true
      isPending = false
      // swallow the error as we don't need it for testing...
    }
  )

  result.isFulfilled = () => isFulfilled
  result.isPending = () => isPending
  result.isRejected = () => isRejected
  return result
}
