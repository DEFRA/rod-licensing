import { Contact, Permission, RecurringPayment, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('recurring payment entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  const createRecurringPayment = ({ contact, permission, cancelledDate = null, cancelledReason = null, nextRecurringPayment } = {}) => {
    const recurringPayment = new RecurringPayment()

    recurringPayment.name = 'Test Name'
    recurringPayment.nextDueDate = '2019-12-14T00:00:00Z'
    recurringPayment.cancelledDate = cancelledDate
    recurringPayment.cancelledReason = cancelledReason
    recurringPayment.endDate = '2019-12-15T00:00:00Z'
    recurringPayment.agreementId = 'c9267c6e-573d-488b-99ab-ea18431fc472'
    recurringPayment.publicId = '649-213'
    recurringPayment.lastDigitsCardNumbers = '1234'
    recurringPayment.status = 1

    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.contact, contact)
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.activePermission, permission)
    if (nextRecurringPayment) {
      recurringPayment.bindToEntity(RecurringPayment.definition.relationships.nextRecurringPayment, nextRecurringPayment)
    }

    return recurringPayment
  }

  const getRecurringPayment = (overrides = {}) => {
    const defaultResponse = {
      '@odata.etag': 'W/"11528905"',
      defra_recurringpaymentid: 'b5b24adf-2e83-ea11-a811-000d3a649213',
      defra_name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
      defra_nextduedate: '2019-12-14T00:00:00Z',
      defra_cancelleddate: '2019-12-14T00:00:00Z',
      defra_cancelledreason: 910400003,
      defra_enddate: '2019-12-15T00:00:00Z',
      defra_agreementid: 'c9267c6e-573d-488b-99ab-ea18431fc472',
      defra_publicid: '649-213',
      defra_lastdigitscardnumbers: '1234',
      statecode: 1,
      _defra_contact_value: 'b3d33cln-2e83-ea11-a811-000d3a649213',
      _defra_activepermission_value: 'a5b24adf-2e83-ea11-a811-000d3a649213',
      _defra_nextrecurringpayment_value: 'q4ra6lma-2e83-ea11-a811-000d3a649213'
    }

    const response = { ...defaultResponse, ...overrides }

    return RecurringPayment.fromResponse(response, optionSetData)
  }

  describe('mappings with cancelled rp', () => {
    it('is a recurring payment', () => {
      const recurringPayment = getRecurringPayment()
      expect(recurringPayment).toBeInstanceOf(RecurringPayment)
    })

    it('matches expectedFields', () => {
      const recurringPayment = getRecurringPayment()
      expect(recurringPayment).toMatchObject(
        expect.objectContaining({
          etag: 'W/"11528905"',
          id: 'b5b24adf-2e83-ea11-a811-000d3a649213',
          name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
          nextDueDate: '2019-12-14T00:00:00Z',
          cancelledDate: '2019-12-14T00:00:00Z',
          cancelledReason: expect.objectContaining({ id: 910400003, label: 'User Cancelled', description: 'User Cancelled' }),
          endDate: '2019-12-15T00:00:00Z',
          agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472',
          publicId: '649-213',
          lastDigitsCardNumbers: '1234',
          status: 1
        })
      )
    })

    it('maps to dynamics', async () => {
      const contact = new Contact()
      const permission = new Permission()
      const recurringPayment = createRecurringPayment({
        contact,
        permission,
        cancelledDate: '2019-10-14T00:00:00Z',
        cancelledReason: optionSetData.defra_cancelledreasons.options['910400003']
      })
      const dynamicsEntity = recurringPayment.toRequestBody()
      expect(dynamicsEntity).toMatchObject(
        expect.objectContaining({
          defra_name: 'Test Name',
          defra_nextduedate: '2019-12-14T00:00:00Z',
          defra_cancelleddate: '2019-10-14T00:00:00Z',
          defra_cancelledreason: 910400003,
          defra_enddate: '2019-12-15T00:00:00Z',
          defra_agreementid: 'c9267c6e-573d-488b-99ab-ea18431fc472',
          defra_publicid: '649-213',
          defra_lastdigitscardnumbers: '1234',
          statecode: 1,
          'defra_Contact@odata.bind': `$${contact.uniqueContentId}`,
          'defra_ActivePermission@odata.bind': `$${permission.uniqueContentId}`
        })
      )
    })
  })

  describe('mappings without cancelled rp', () => {
    it('is a recurring payment', () => {
      const recurringPayment = getRecurringPayment({ defra_cancelleddate: null, defra_cancelledreason: null })
      expect(recurringPayment).toBeInstanceOf(RecurringPayment)
    })

    it('matches expectedFields', () => {
      const recurringPayment = getRecurringPayment({ defra_cancelleddate: null, defra_cancelledreason: null })
      expect(recurringPayment).toMatchObject(
        expect.objectContaining({
          etag: 'W/"11528905"',
          id: 'b5b24adf-2e83-ea11-a811-000d3a649213',
          name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a',
          nextDueDate: '2019-12-14T00:00:00Z',
          cancelledDate: null,
          cancelledReason: null,
          endDate: '2019-12-15T00:00:00Z',
          agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472',
          publicId: '649-213',
          lastDigitsCardNumbers: '1234',
          status: 1
        })
      )
    })

    it('maps to dynamics', async () => {
      const contact = new Contact()
      const permission = new Permission()
      const recurringPayment = createRecurringPayment({ contact, permission })
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
          defra_lastdigitscardnumbers: '1234',
          statecode: 1,
          'defra_Contact@odata.bind': `$${contact.uniqueContentId}`,
          'defra_ActivePermission@odata.bind': `$${permission.uniqueContentId}`
        })
      )
    })
  })

  describe('mappings with a nextRecurringPayment', () => {
    it('maps to dynamics', async () => {
      const contact = new Contact()
      const permission = new Permission()
      const nextRecurringPayment = new RecurringPayment()
      const recurringPayment = createRecurringPayment({ contact, permission, nextRecurringPayment })
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
          defra_lastdigitscardnumbers: '1234',
          statecode: 1,
          'defra_Contact@odata.bind': `$${contact.uniqueContentId}`,
          'defra_ActivePermission@odata.bind': `$${permission.uniqueContentId}`,
          'defra_NextRecurringPayment@odata.bind': `$${nextRecurringPayment.uniqueContentId}`
        })
      )
    })
  })
})
