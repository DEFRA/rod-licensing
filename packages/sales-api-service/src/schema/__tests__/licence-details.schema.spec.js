import moment from 'moment'
import { licenceDetailsRequestQuerySchema, licenceDetailsResponseSchema } from '../licence-details.schema.js'

const getRequestSampleData = () => ({
  licenseeFirstName: 'Laila',
  licenseeLastName: 'Alial',
  licenseeBirthDate: '2000-10-03',
  licenseePostcode: 'W8 7PP'
})

const optionSetOptionSample = () => ({ id: 910400000, label: 'Example Label', description: 'Example Description' })

const addDays = days => moment().add(days, 'days').toISOString()

const getResponseSampleData = () => ({
  licences: [
    {
      id: 'a17fc331-141b-4fc0-8549-329d6934fadb',
      referenceNumber: '00310321-2DC3FAS-F4A315',
      issueDate: new Date().toISOString(),
      startDate: addDays(7),
      endDate: addDays(7 + 365),
      stagingId: 'a17fc331-141b-4fc0-8549-329d6934fadb',
      licensee: {
        firstName: 'Laila',
        lastName: 'Alial',
        birthDate: '2000-10-03',
        premises: '1',
        town: 'Exampleton',
        postcode: 'W8 7PP',
        country: optionSetOptionSample()
      },
      permit: {
        id: 'a17fc331-141b-4fc0-8549-329d6934fadb',
        description: 'Coarse 12 month 3 Rod Licence',
        availableFrom: new Date().toISOString(),
        availableTo: new Date().toISOString(),
        isForFulfilment: true,
        isCounterSales: false,
        isRecurringPaymentSupported: true
      }
    }
  ]
})

describe('licenceDetailsRequestQuerySchema', () => {
  it('validates successfully when all query parameters are valid', async () => {
    const result = await licenceDetailsRequestQuerySchema.validateAsync(getRequestSampleData())
    expect(result).toEqual(getRequestSampleData())
  })

  it.each([['licenseeFirstName'], ['licenseeLastName'], ['licenseeBirthDate'], ['licenseePostcode']])(
    'fails when %s is missing',
    async field => {
      const { [field]: _, ...invalidData } = getRequestSampleData()
      await expect(licenceDetailsRequestQuerySchema.validateAsync(invalidData)).rejects.toThrow(`"${field}" is required`)
    }
  )

  it('validates and formats a UK postcode', async () => {
    const result = await licenceDetailsRequestQuerySchema.validateAsync({ ...getRequestSampleData(), licenseePostcode: 'w87pp' })
    expect(result.licenseePostcode).toBe('W8 7PP')
  })

  it('validates an overseas postcode', async () => {
    const result = await licenceDetailsRequestQuerySchema.validateAsync({ ...getRequestSampleData(), licenseePostcode: '90210' })
    expect(result.licenseePostcode).toBe('90210')
  })

  it('fails when the postcode is invalid', async () => {
    await expect(
      licenceDetailsRequestQuerySchema.validateAsync({ ...getRequestSampleData(), licenseePostcode: '!!invalid!!' })
    ).rejects.toThrow('"licenseePostcode" does not match any of the allowed types')
  })
})

describe('licenceDetailsResponseSchema', () => {
  it('validates successfully with a valid licences array', async () => {
    const sampleData = getResponseSampleData()
    const result = await licenceDetailsResponseSchema.validateAsync(sampleData)
    expect(result).toEqual(sampleData)
  })

  it('fails when the licences array is missing', async () => {
    await expect(licenceDetailsResponseSchema.validateAsync({})).rejects.toThrow('"licences" is required')
  })

  it('fails when a nested field is invalid', async () => {
    const invalidData = getResponseSampleData()
    invalidData.licences[0].permit.id = 'not-a-guid'
    await expect(licenceDetailsResponseSchema.validateAsync(invalidData)).rejects.toThrow('"licences[0].permit.id" must be a valid GUID')
  })
})
