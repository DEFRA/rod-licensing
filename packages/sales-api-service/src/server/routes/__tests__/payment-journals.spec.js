import {
  getPaymentJournal,
  createPaymentJournal,
  updatePaymentJournal,
  queryJournalsByTimestamp
} from '../../../services/paymentjournals/payment-journals.service.js'
import initialiseServer from '../../index.js'
jest.mock('../../../services/paymentjournals/payment-journals.service.js')

let server = null
describe('payment journals handlers', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })
  afterAll(async () => {
    await server.stop()
  })
  beforeEach(jest.clearAllMocks)

  describe('getPaymentJournal', () => {
    it('returns the result of the getPaymentJournal service method', async () => {
      getPaymentJournal.mockResolvedValueOnce({ test: 'data' })
      const result = await server.inject({ method: 'GET', url: '/paymentJournals/test-id' })
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({
        test: 'data'
      })
    })

    it('returns 404 if journal not found', async () => {
      getPaymentJournal.mockResolvedValueOnce(undefined)
      const result = await server.inject({ method: 'GET', url: '/paymentJournals/test-id' })
      expect(result.statusCode).toBe(404)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Not Found',
        message: 'Not Found',
        statusCode: 404
      })
    })
  })

  describe('createPaymentJournal', () => {
    it('returns the result of the createPaymentJournal service method', async () => {
      createPaymentJournal.mockResolvedValueOnce({ test: 'data' })
      const result = await server.inject({
        method: 'PUT',
        url: '/paymentJournals/test-id',
        payload: {
          paymentTimestamp: '2020-05-29T11:44:45.875Z',
          paymentReference: '95c78bcd-347e-4d08-ad7e-f4833d2a6f86',
          paymentStatus: 'In Progress'
        }
      })
      expect(result.statusCode).toBe(201)
      expect(JSON.parse(result.payload)).toMatchObject({
        test: 'data'
      })
    })

    it('returns 409 response if the journal for the given id already exists', async () => {
      createPaymentJournal.mockRejectedValueOnce(Object.assign(new Error(), { code: 'ConditionalCheckFailedException' }))
      const result = await server.inject({
        method: 'PUT',
        url: '/paymentJournals/test-id',
        payload: {
          paymentTimestamp: '2020-05-29T11:44:45.875Z',
          paymentReference: '95c78bcd-347e-4d08-ad7e-f4833d2a6f86',
          paymentStatus: 'In Progress'
        }
      })
      expect(result.statusCode).toBe(409)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Conflict',
        message: 'A payment journal with the given identifier already exists',
        statusCode: 409
      })
    })

    it('returns 422 response if the payload is invalid', async () => {
      const result = await server.inject({ method: 'PUT', url: '/paymentJournals/test-id', payload: {} })
      expect(result.statusCode).toBe(422)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unprocessable Entity',
        message: 'Invalid payload: "paymentReference" is required',
        statusCode: 422
      })
    })

    it('throws unexpected errors to the default error handler', async () => {
      createPaymentJournal.mockRejectedValueOnce(new Error('Unexpected test error'))
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      const result = await server.inject({
        method: 'PUT',
        url: '/paymentJournals/test-id',
        payload: {
          paymentTimestamp: '2020-05-29T11:44:45.875Z',
          paymentReference: '95c78bcd-347e-4d08-ad7e-f4833d2a6f86',
          paymentStatus: 'In Progress'
        }
      })
      expect(result.statusCode).toBe(500)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Internal Server Error',
        message: 'Unexpected test error',
        statusCode: 500
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('updatePaymentJournal', () => {
    it('returns the result of the updatePaymentJournal service method', async () => {
      updatePaymentJournal.mockResolvedValueOnce({ test: 'data' })
      const result = await server.inject({
        method: 'PATCH',
        url: '/paymentJournals/test-id',
        payload: {
          paymentTimestamp: '2020-05-29T11:44:45.875Z',
          paymentReference: '95c78bcd-347e-4d08-ad7e-f4833d2a6f86',
          paymentStatus: 'In Progress'
        }
      })
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({
        test: 'data'
      })
    })

    it('returns 422 response if the payload is invalid', async () => {
      const result = await server.inject({ method: 'PATCH', url: '/paymentJournals/test-id', payload: {} })
      expect(result.statusCode).toBe(422)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unprocessable Entity',
        message:
          'Invalid payload: "update-payment-journal-request" must contain at least one of [paymentTimestamp, paymentReference, paymentStatus]',
        statusCode: 422
      })
    })

    it('returns 404 if journal not found', async () => {
      updatePaymentJournal.mockRejectedValueOnce(Object.assign(new Error(), { code: 'ConditionalCheckFailedException' }))
      const result = await server.inject({
        method: 'PATCH',
        url: '/paymentJournals/test-id',
        payload: {
          paymentTimestamp: '2020-05-29T11:44:45.875Z',
          paymentReference: '95c78bcd-347e-4d08-ad7e-f4833d2a6f86',
          paymentStatus: 'In Progress'
        }
      })
      expect(result.statusCode).toBe(404)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Not Found',
        message: 'Not Found',
        statusCode: 404
      })
    })

    it('throws unexpected errors to the default error handler', async () => {
      updatePaymentJournal.mockRejectedValueOnce(new Error('Unexpected test error'))
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      const result = await server.inject({
        method: 'PATCH',
        url: '/paymentJournals/test-id',
        payload: {
          paymentTimestamp: '2020-05-29T11:44:45.875Z',
          paymentReference: '95c78bcd-347e-4d08-ad7e-f4833d2a6f86',
          paymentStatus: 'In Progress'
        }
      })
      expect(result.statusCode).toBe(500)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Internal Server Error',
        message: 'Unexpected test error',
        statusCode: 500
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('queryJournalsByTimestamp', () => {
    it('returns the result of the queryJournalsByTimestamp service method', async () => {
      queryJournalsByTimestamp.mockResolvedValueOnce([{ test: 'data' }])
      const result = await server.inject({
        method: 'GET',
        url: '/paymentJournals?paymentStatus=In Progress&from=2020-05-29T11:44:45.875Z&to=2020-05-29T11:44:45.875Z'
      })
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toStrictEqual([{ test: 'data' }])
    })

    it('returns 400 response if the required parameters are not present', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/paymentJournals'
      })
      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Bad Request',
        message: 'Invalid query: "from" is required',
        statusCode: 400
      })
    })

    it('returns 400 response if the from date is after the to date', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/paymentJournals?paymentStatus=In Progress&from=2020-05-29T11:44:45.875Z&to=2020-05-29T11:44:45.874Z'
      })
      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Bad Request',
        message: 'Invalid query: From date must not be after to date (value)',
        statusCode: 400
      })
    })
  })
})
