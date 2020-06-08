import { MOCK_12MONTH_SENIOR_PERMIT, MOCK_1DAY_SENIOR_PERMIT_ENTITY } from '../../../__mocks__/test-data.js'
import initialiseServer from '../../index.js'
let server = null

jest.mock('../../../services/reference-data.service.js', () => ({
  ENTITY_TYPES: [MOCK_12MONTH_SENIOR_PERMIT.constructor],
  getReferenceDataForEntity: jest.fn(async entityType => {
    return [MOCK_12MONTH_SENIOR_PERMIT, MOCK_1DAY_SENIOR_PERMIT_ENTITY]
  })
}))

describe('reference-data endpoint', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  it('returns a full reference data listing when no filter parameters are specified', async () => {
    const result = await server.inject({ method: 'GET', url: '/permits' })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })
    const payload = JSON.parse(result.payload)
    expect(payload).toHaveLength(2)
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: MOCK_12MONTH_SENIOR_PERMIT.id
        }),
        expect.objectContaining({
          id: MOCK_1DAY_SENIOR_PERMIT_ENTITY.id
        })
      ])
    )
  })

  it('allows filtering when a parameter is given which matches a field', async () => {
    const result = await server.inject({ method: 'GET', url: `/permits?id=${MOCK_12MONTH_SENIOR_PERMIT.id}` })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })
    const payload = JSON.parse(result.payload)
    expect(payload).toHaveLength(1)
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: MOCK_12MONTH_SENIOR_PERMIT.id
        })
      ])
    )
  })

  it('returns an empty array if no match is found', async () => {
    const result = await server.inject({ method: 'GET', url: '/permits?id=notFound' })
    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      }
    })
    const payload = JSON.parse(result.payload)
    expect(payload).toHaveLength(0)
  })
})
