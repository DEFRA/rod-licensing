import { StagingException } from '../staging-exception.entity.js'

describe('staging exception entity', () => {
  it('maps from dynamics', async () => {
    const recurringPayment = StagingException.fromResponse(
      {
        '@odata.etag': 'W/"53585134"',
        defra_crmstagingexceptionid: 'b5b24acd-2e83-ea11-a811-000d3a649213',
        defra_name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
        defra_description: 'Example error description',
        defra_jsonobject: '{ "json": "string" }'
      },
      {}
    )

    const expectedFields = {
      id: 'b5b24acd-2e83-ea11-a811-000d3a649213',
      stagingId: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
      description: 'Example error description',
      exceptionJson: '{ "json": "string" }'
    }

    expect(recurringPayment).toBeInstanceOf(StagingException)
    expect(recurringPayment).toMatchObject(expect.objectContaining({ etag: 'W/"53585134"', ...expectedFields }))
    expect(recurringPayment.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(recurringPayment.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const exception = new StagingException()
    exception.stagingId = 'Test Staging Id'
    exception.description = 'Test description'
    exception.exceptionJson = '{ "json": "string" }'

    const dynamicsEntity = exception.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'Test Staging Id',
        defra_description: 'Test description',
        defra_jsonobject: '{ "json": "string" }'
      })
    )
  })
})
