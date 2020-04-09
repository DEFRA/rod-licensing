import initialiseServer from '../../index.js'
let server = null

const getOptionSetMappingExpectation = (name, ...keys) => {
  const options = keys.reduce((acc, k) => {
    acc[k] = expect.objectContaining({
      id: k,
      label: expect.anything(),
      description: expect.anything()
    })
    return acc
  }, {})

  return expect.objectContaining({
    name: name,
    options: expect.objectContaining(options)
  })
}

describe('option-sets endpoint', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  it('returns a full option-set data listing', async () => {
    const result = await server.inject({
      method: 'GET',
      url: '/option-sets'
    })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })

    expect(JSON.parse(result.payload)).toMatchObject(
      expect.objectContaining({
        defra_duration: getOptionSetMappingExpectation('defra_duration', 910400000, 910400001, 910400002, 910400003),
        defra_concessionproof: getOptionSetMappingExpectation('defra_concessionproof', 910400000, 910400001, 910400002, 910400003)
      })
    )
  })

  it('returns an option-set defintion for a given name', async () => {
    const result = await server.inject({
      method: 'GET',
      url: '/option-sets/defra_duration'
    })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })

    expect(JSON.parse(result.payload)).toMatchObject(
      getOptionSetMappingExpectation('defra_duration', 910400000, 910400001, 910400002, 910400003)
    )
  })

  it('returns a 400 error if a unknown name is used', async () => {
    const result = await server.inject({ method: 'GET', url: '/option-sets/Unknown' })
    expect(result).toMatchObject({
      statusCode: 400,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })
  })
})
