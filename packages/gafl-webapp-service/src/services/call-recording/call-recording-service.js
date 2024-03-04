import db from 'debug'
const debug = db('webapp:call-recording-service')

export const pauseRecording = async agent => {
  debug('Sending pause recording request to Storm for agent: %s', agent)
}

export const resumeRecording = async agent => {
  debug('Sending resume recording request to Storm for agent: %s', agent)
}
