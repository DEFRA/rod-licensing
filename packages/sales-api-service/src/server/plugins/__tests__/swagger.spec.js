import initialiseServer from '../../index.js'
let server = null

describe('hapi swagger integration', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  it('exposes a swagger.json definition', async () => {
    const result = await server.inject({ method: 'GET', url: '/swagger.json' })

    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      },
      payload: expect.stringContaining('swagger')
    })
  })

  it('exposes a swagger documentation ui', async () => {
    const result = await server.inject({ method: 'GET', url: '/documentation' })

    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8'
      },
      payload: expect.stringContaining('swagger')
    })
  })
})
