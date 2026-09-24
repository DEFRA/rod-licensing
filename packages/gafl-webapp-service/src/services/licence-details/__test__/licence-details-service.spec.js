import { salesApi } from '@defra-fish/connectors-lib'
import { licenceDetailsService } from '../licence-details-service'
jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    getLicenceDetails: jest.fn(() => ({ licences: [] }))
  }
}))

const getParams = () => ({
  firstName: 'Fishy',
  lastName: 'McFishface',
  birthDate: '2000-01-01',
  postcode: 'TE1 1ST'
})

describe('licence-details-service', () => {
  it('calls getLicenceDetails with the correct params', async () => {
    const params = getParams()
    await licenceDetailsService(params)

    expect(salesApi.getLicenceDetails).toHaveBeenCalledWith(params)
  })

  it.each([
    ['there are no matches', { licences: [] }],
    ['there is one match', { licences: [{ referenceNumber: 'AAAAAA-1' }] }],
    ['there are multiple matches', { licences: [{ referenceNumber: 'AAAAAA-1' }, { referenceNumber: 'AAAAAA-2' }] }]
  ])('returns the correct result when %s', async (_description, responseBody) => {
    salesApi.getLicenceDetails.mockResolvedValueOnce(responseBody)

    const result = await licenceDetailsService(getParams())
    expect(result).toBe(responseBody.licences)
  })

  it('returns an empty array when there is no licences object in the result', async () => {
    salesApi.getLicenceDetails.mockResolvedValueOnce({})

    const result = await licenceDetailsService(getParams())
    expect(result).toEqual([])
  })

  describe('if getLicenceDetails throws an error', () => {
    it('catches the error', async () => {
      const error = new Error('Something went wrong')
      salesApi.getLicenceDetails.mockRejectedValueOnce(error)

      await expect(licenceDetailsService(getParams())).resolves.toBeDefined()
    })

    it('calls console.error with the details', async () => {
      const error = new Error('Something went wrong')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      salesApi.getLicenceDetails.mockRejectedValueOnce(error)
      const params = getParams()

      await licenceDetailsService(params)

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error retrieving licence details for ${JSON.stringify(params)}`, error)
      consoleErrorSpy.mockRestore()
    })

    it('returns an empty array', async () => {
      const error = new Error('Something went wrong')
      salesApi.getLicenceDetails.mockRejectedValueOnce(error)

      const results = await licenceDetailsService(getParams())

      expect(results).toEqual([])
    })
  })
})
