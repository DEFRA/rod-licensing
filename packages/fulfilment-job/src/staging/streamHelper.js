import { finished, pipeline } from 'stream'

export default {
  pipelinePromise: (...args) => {
    return new Promise((resolve, reject) => {
      const callbackHander = err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
      pipeline(...args, callbackHander)
      finished(args[0], { readable: false }, callbackHander)
    })
  }
}
