import initialiseServer from '../index.js'

describe('hapi server', () => {
  it('starts on a configured port', async () => {
    process.env.PORT = null
    const server = await initialiseServer({ port: 6666 })
    expect(server.info.port).toEqual(6666)
    await server.stop()
  })

  it('starts on a port defined by the environment', async () => {
    process.env.PORT = 6666
    const server = await initialiseServer()
    expect(server.info.port).toEqual(6666)
    await server.stop()
  })

  it('uses port 4000 if no port is specified', async () => {
    delete process.env.PORT
    const server = await initialiseServer()
    expect(server.info.port).toEqual(4000)
    await server.stop()
  })

  it('exposes a landing page', async () => {
    const server = await initialiseServer({ port: null })
    const result = await server.inject({ method: 'GET', url: '/' })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8'
      }
    })
    await server.stop()
  })

  it('exposes a landing page', async () => {
    const server = await initialiseServer({ port: null })
    const result = await server.inject({ method: 'GET', url: '/' })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8'
      }
    })
    await server.stop()
  })
})
