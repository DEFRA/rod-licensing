import { contactForLicenseeNoReference, executeQuery } from '@defra-fish/dynamics-lib'
import db from 'debug'
jest.mock('@defra-fish/dynamics-lib')
jest.mock('debug')

describe('executeWithErrorLog', () => {
  it('throws error', async () => {
    const debug = jest.fn()
    db.mockReturnValueOnce(debug)
    executeQuery.mockImplementation(() => {
      throw new Error()
    })
    contactForLicenseeNoReference.mockReturnValueOnce({ filter: 'query filter test' })
    const authenticate = require('../authenticate.js').default
    const [
      {
        options: { handler }
      }
    ] = authenticate
    const mockRequest = {
      query: { licenseeBirthDate: '', licenseePostcode: '' },
      params: { referenceNumber: '' }
    }

    try {
      await handler(mockRequest)
    } catch {}

    expect(debug).toHaveBeenCalledWith('Error executing query with filter query filter test')
  })
})
