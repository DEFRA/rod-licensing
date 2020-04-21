import { Contact, RecurringPayment, RecurringPaymentInstruction, Permit, retrieveGlobalOptionSets } from '../../index.js'

let optionSetData
describe('recurring payment entity', () => {
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })

  it('maps from dynamics', async () => {
    const instruction = RecurringPaymentInstruction.fromResponse(
      {
        '@odata.etag': 'W/"53585154"',
        defra_recurringpaymentinstructionid: 'bfb24adf-2e83-ea11-a811-000d3a649213',
        defra_name: '18569ba8-094e-4e8c-9911-bfedd5ccc17a'
      },
      optionSetData
    )

    const expectedFields = {
      id: 'bfb24adf-2e83-ea11-a811-000d3a649213',
      referenceNumber: '18569ba8-094e-4e8c-9911-bfedd5ccc17a'
    }

    expect(instruction).toBeInstanceOf(RecurringPaymentInstruction)
    expect(instruction).toMatchObject(expect.objectContaining({ etag: 'W/"53585154"', ...expectedFields }))
    expect(instruction.toJSON()).toMatchObject(expect.objectContaining(expectedFields))
    expect(JSON.parse(instruction.toString())).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const contact = new Contact()
    const permit = new Permit()
    const recurringPayment = new RecurringPayment()

    const instruction = new RecurringPaymentInstruction()
    instruction.referenceNumber = 'Test Reference Number'
    instruction.bindToContact(contact)
    instruction.bindToPermit(permit)
    instruction.bindToRecurringPayment(recurringPayment)

    const dynamicsEntity = instruction.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        defra_name: 'Test Reference Number',
        'defra_Contact@odata.bind': `$${contact.uniqueContentId}`,
        'defra_Permit@odata.bind': `$${permit.uniqueContentId}`,
        'defra_RecurringPayment@odata.bind': `$${recurringPayment.uniqueContentId}`
      })
    )
  })
})
