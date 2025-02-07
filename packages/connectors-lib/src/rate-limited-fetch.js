import fetch from 'node-fetch'

const doFetch = async (delay, ...args) => {
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  return fetch(...args)
}

export default async (...args) => {
  const delays = [0, 1, 2, 4]
  while (delays.length) {
    const currentDelay = delays.shift() * 1000
    const response = await doFetch(currentDelay, ...args)
    if (response.status !== 429) {
      return response
    }
  }
}
