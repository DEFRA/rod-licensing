import { Contact, Permission, RecurringPayment, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('recurring payment entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const recurringPayment = RecurringPayment.fromResponse(
      {
        '@odata.etag': 'W/"11528905"',
        defra_recurringpaymentid: 'b5b24adf-2e83-ea11-a811-000d3a649213',
        defra_name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
        defra_nextduedate: '2019-12-14T00:00:00Z',
        defra_cancelleddate: null,
        defra_cancelledreason: null,
        defra_enddate: '2019-12-15T00:00:00Z',
        defra_agreementid: 'c9267c6e-573d-488b-99ab-ea18431fc472',
        defra_publicid: '649-213',
        statecode: 1,
        _defra_contact_value: 'b3d33cln-2e83-ea11-a811-000d3a649213',
        _defra_activepermission_value: 'a5b24adf-2e83-ea11-a811-000d3a649213'
      },
      optionSetData
    )

    const expectedFields = {
      id: 'b5b24adf-2e83-ea11-a811-000d3a649213',
      name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
      nextDueDate: '2019-12-14T00:00:00Z',
      cancelledDate: null,
      cancelledReason: null,
      endDate: '2019-12-15T00:00:00Z',
      agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472',
      publicId: '649-213',
      status: 1,
      activePermission: 'a5b24adf-2e83-ea11-a811-000d3a649213',
      contactId: 'b3d33cln-2e83-ea11-a811-000d3a649213'
    }

    expect(recurringPayment).toBeInstanceOf(RecurringPayment)
    expect(recurringPayment).toMatchObject(expect.objectContaining({ etag: 'W/"11528905"', ...expectedFields }))
    expect(recurringPayment.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(recurringPayment.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const contact = new Contact()
    const permission = new Permission()
    const recurringPayment = new RecurringPayment()
    recurringPayment.name = 'Test Name'
    recurringPayment.nextDueDate = '2019-12-14T00:00:00Z'
    recurringPayment.cancelledDate = null
    recurringPayment.cancelledReason = null
    recurringPayment.endDate = '2019-12-15T00:00:00Z'
    recurringPayment.agreementId = 'c9267c6e-573d-488b-99ab-ea18431fc472'
    recurringPayment.publicId = '649-213'
    recurringPayment.status = 1
    recurringPayment.contactId = 'b3d33cln-2e83-ea11-a811-000d3a649213'
    recurringPayment.activePermission = 'a5b24adf-2e83-ea11-a811-000d3a649213'
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.contact, contact)
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.activePermission, permission)

    const dynamicsEntity = recurringPayment.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'Test Name',
        defra_nextduedate: '2019-12-14T00:00:00Z',
        defra_cancelleddate: null,
        defra_cancelledreason: null,
        defra_enddate: '2019-12-15T00:00:00Z',
        defra_agreementid: 'c9267c6e-573d-488b-99ab-ea18431fc472',
        defra_publicid: '649-213',
        statecode: 1,
        _defra_activepermission_value: 'a5b24adf-2e83-ea11-a811-000d3a649213',
        _defra_contact_value: 'b3d33cln-2e83-ea11-a811-000d3a649213',
        'defra_contact@odata.bind': `$${contact.uniqueContentId}`,
        'defra_permission@odata.bind': `$${permission.uniqueContentId}`
      })
    )
  })

  it('maps from dynamics with cancelled', async () => {
    const recurringPayment = RecurringPayment.fromResponse(
      {
        '@odata.etag': 'W/"11528905"',
        defra_recurringpaymentid: 'b5b24adf-2e83-ea11-a811-000d3a649213',
        defra_name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
        defra_nextduedate: '2019-12-14T00:00:00Z',
        defra_cancelleddate: '2019-12-14T00:00:00Z',
        defra_cancelledreason: 910400195,
        defra_enddate: '2019-12-15T00:00:00Z',
        defra_agreementid: 'c9267c6e-573d-488b-99ab-ea18431fc472',
        defra_publicid: '649-213',
        statecode: 1,
        _defra_contact_value: 'b3d33cln-2e83-ea11-a811-000d3a649213',
        _defra_activepermission_value: 'a5b24adf-2e83-ea11-a811-000d3a649213'
      },
      optionSetData
    )

    const expectedFields = {
      id: 'b5b24adf-2e83-ea11-a811-000d3a649213',
      name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
      nextDueDate: '2019-12-14T00:00:00Z',
      cancelledDate: '2019-12-14T00:00:00Z',
      cancelledReason: expect.objectContaining({ id: 910400195, label: 'User cancelled', description: 'User cancelled' }),
      endDate: '2019-12-15T00:00:00Z',
      agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472',
      publicId: '649-213',
      status: 1,
      activePermission: 'a5b24adf-2e83-ea11-a811-000d3a649213',
      contactId: 'b3d33cln-2e83-ea11-a811-000d3a649213'
    }

    expect(recurringPayment).toBeInstanceOf(RecurringPayment)
    expect(recurringPayment).toMatchObject(expect.objectContaining({ etag: 'W/"11528905"', ...expectedFields }))
    expect(recurringPayment.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(recurringPayment.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics with cancelled', async () => {
    const contact = new Contact()
    const permission = new Permission()
    const recurringPayment = new RecurringPayment()
    recurringPayment.name = 'Test Name'
    recurringPayment.nextDueDate = '2019-12-14T00:00:00Z'
    recurringPayment.cancelledDate = '2019-12-14T00:00:00Z'
    recurringPayment.cancelledReason = optionSetData.defra_cancelledreason.options['910400195']
    recurringPayment.endDate = '2019-12-15T00:00:00Z'
    recurringPayment.agreementId = 'c9267c6e-573d-488b-99ab-ea18431fc472'
    recurringPayment.publicId = '649-213'
    recurringPayment.status = 1
    recurringPayment.contactId = 'b3d33cln-2e83-ea11-a811-000d3a649213'
    recurringPayment.activePermission = 'a5b24adf-2e83-ea11-a811-000d3a649213'
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.contact, contact)
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.activePermission, permission)

    const dynamicsEntity = recurringPayment.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'Test Name',
        defra_nextduedate: '2019-12-14T00:00:00Z',
        defra_cancelleddate: '2019-12-14T00:00:00Z',
        defra_cancelledreason: 910400195,
        defra_enddate: '2019-12-15T00:00:00Z',
        defra_agreementid: 'c9267c6e-573d-488b-99ab-ea18431fc472',
        defra_publicid: '649-213',
        statecode: 1,
        _defra_activepermission_value: 'a5b24adf-2e83-ea11-a811-000d3a649213',
        _defra_contact_value: 'b3d33cln-2e83-ea11-a811-000d3a649213',
        'defra_contact@odata.bind': `$${contact.uniqueContentId}`,
        'defra_permission@odata.bind': `$${permission.uniqueContentId}`
      })
    )
  })
})
