import { pipeline } from 'stream'
import { promisify } from 'util'

export default {
  pipelinePromise: promisify(pipeline)
}
