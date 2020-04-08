'use strict'

const fetch = jest.genMockFromModule('node-fetch')

let result
let exception

fetch.__goodResult = () => {
  exception = null
  result = {
    text: async () =>
      JSON.stringify({
        id: '59cd2b81-7948-47e6-971c-21bb8e7adc4b'
      }),
    status: 200,
    statusText: 'OK',
    ok: true
  }
}

fetch.__BadGateway = () => {
  exception = null
  result = {
    text: async () =>
      JSON.stringify({
        statusCode: 502,
        message: 'Bad Gateway'
      }),
    status: 502,
    statusText: 'Bad Gateway',
    ok: false
  }
}

fetch.__NotFound = () => {
  exception = new Error('Error')
}

fetch.mockImplementation(async () => {
  if (exception) {
    return new Promise((resolve, reject) => reject(exception))
  }

  return new Promise((resolve, reject) => resolve(result))
})

export default fetch
