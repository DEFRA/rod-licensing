import initialiseServer from '../index.js'
let server = null

describe('hapi server', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  it('exposes a landing page', async () => {
    const result = await server.inject({ method: 'GET', url: '/' })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8'
      }
    })
  })
})
