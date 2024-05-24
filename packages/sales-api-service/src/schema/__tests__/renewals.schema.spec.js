import { permissionRenewalDataRequestParamsSchema, permissionRenewalDataResponseSchema } from '../renewals.schema.js'

describe('permissionRenewalDataRequestParamsSchema', () => {
  it('validates successfully when referenceNumber is valid', async () => {
    const result = await permissionRenewalDataRequestParamsSchema.validateAsync({ referenceNumber: '00310321-2DC3FAS-F4A315' })
    expect(result).toBeInstanceOf(Object)
  })

  it('does not validate when referenceNumber is invalid', async () => {
    await expect(permissionRenewalDataRequestParamsSchema.validateAsync({ foo: 'bar' })).rejects.toThrow('"referenceNumber" is required')
  })
})

describe('permissionRenewalDataResponseSchema', () => {
  const mockResponseData = () => ({
    permission: {
      id: 'dbd3a8a7-cad7-4567-9e68-c787899f5093',
      referenceNumber: '00310321-2DC3FAS-F4A315',
      issueDate: new Date().toISOString(),
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      stagingId: 'dbd3a8a7-cad7-4567-9e68-c787899f5093',
      dataSource: {
        id: 910400000,
        label: 'Example Label',
        description: 'Example Description'
      },
      licensee: {
        firstName: 'Sally',
        lastName: 'Salmon',
        birthDate: '1990-01-01'
      },
      concessions: [],
      permit: {
        id: 'dbd3a8a7-cad7-4567-9e68-c787899f5093',
        description: 'Coarse 12 month 3 Rod Licence',
        availableFrom: new Date().toISOString(),
        availableTo: new Date().toISOString(),
        isForFulfilment: true,
        isCounterSales: false,
        isRecurringPaymentSupported: true
      }
    }
  })

  it('validates successfully when the response data is valid', async () => {
    const result = await permissionRenewalDataResponseSchema.validateAsync(mockResponseData())
    expect(result).toBeInstanceOf(Object)
  })

  it('does not validate when finalisedPermissionSchemaContent is invalid', async () => {
    const response = mockResponseData()
    response.issueDate = 'foo'
    await expect(permissionRenewalDataRequestParamsSchema.validateAsync(response)).rejects.toThrow('"referenceNumber" is required')
  })

  it('does not validate when contactResponseSchema is invalid', async () => {
    const response = mockResponseData()
    response.licensee = {}
    await expect(permissionRenewalDataRequestParamsSchema.validateAsync(response)).rejects.toThrow('"referenceNumber" is required')
  })

  it('does not validate when concessionProofSchema is invalid', async () => {
    const response = mockResponseData()
    response.concessions = {}
    await expect(permissionRenewalDataRequestParamsSchema.validateAsync(response)).rejects.toThrow('"referenceNumber" is required')
  })

  it('does not validate when permitSchema is invalid', async () => {
    const response = mockResponseData()
    response.permit = {}
    await expect(permissionRenewalDataRequestParamsSchema.validateAsync(response)).rejects.toThrow('"referenceNumber" is required')
  })
})
