import { PoclValidationError } from '../pocl-validation-error.entity.js'
import { retrieveGlobalOptionSets } from '../..'

describe('pocl staging exception entity', () => {
  let optionSetData
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })
  describe('maps from dynamics', () => {
    let exception
    beforeEach(() => {
      exception = PoclValidationError.fromResponse(
        {
          '@odata.etag': 'W/"56351087"',
          defra_poclvalidationerrorid: '91f15d18-0aa4-ea11-a812-000d3a64905b',
          defra_firstname: 'Daniel',
          defra_name: 'Ricciardo',
          defra_organisation: 'Fishy Endeavours',
          defra_premises: '14 Howecroft Court',
          defra_street: 'Eastmead Lane',
          defra_locality: 'Stoke Bishop',
          defra_town: 'Bristol',
          defra_postcode: 'BS9 1HJ',
          defra_country: 'GB',
          defra_birthdate: '1989-07-01',
          defra_emailaddress: 'daniel-ricc@example.couk',
          defra_mobilenumber: '07722 123456',
          defra_preferredmethodofnewsletter: 910400003,
          defra_preferredmethodofconfirmation: 910400000,
          defra_preferredmethodofreminder: 910400002,
          defra_postalfulfilment: true,
          defra_concessions: '[{"type":"Blue Badge","referenceNumber":123456789}]',
          defra_startdate: '2021-06-15',
          defra_serialnumber: '14345-48457J',
          defra_permitid: 'test-permit-id',
          defra_transactiondate: '2020-01-01T14:00:00Z',
          defra_amount: 30,
          defra_paymentsource: 'Post Office Sales',
          defra_channelid: '948594',
          defra_methodofpayment: 910400001,
          defra_status: 910400000,
          defra_datasource: 910400000,
          defra_transactionfile: 'test-pocl-file.xml',
          statecode: 1,
          defra_errormessage: '"permissions[0].licensee.email" must be a valid email'
        },
        optionSetData
      )
    })

    it('returns a PoclValidationError instance', () => {
      expect(exception).toBeInstanceOf(PoclValidationError)
    })

    it('has the expected data', () => {
      expect(exception).toMatchSnapshot()
    })

    it('has the expected fields', () => {
      const expectedFields = {
        firstName: 'Daniel',
        lastName: 'Ricciardo',
        organisation: 'Fishy Endeavours',
        premises: '14 Howecroft Court',
        street: 'Eastmead Lane',
        locality: 'Stoke Bishop',
        town: 'Bristol',
        postcode: 'BS9 1HJ',
        country: 'GB',
        birthDate: '1989-07-01',
        email: 'daniel-ricc@example.couk',
        mobilePhone: '07722 123456',
        preferredMethodOfConfirmation: expect.objectContaining({ id: 910400000, label: 'Email', description: 'Email' }),
        preferredMethodOfNewsletter: expect.objectContaining({
          id: 910400003,
          label: 'Prefer not to be contacted',
          description: 'Prefer not to be contacted'
        }),
        preferredMethodOfReminder: expect.objectContaining({ id: 910400002, label: 'Text', description: 'Text' }),
        postalFulfilment: true,
        concessions: '[{"type":"Blue Badge","referenceNumber":123456789}]',
        startDate: '2021-06-15',
        serialNumber: '14345-48457J',
        permitId: 'test-permit-id',
        transactionDate: '2020-01-01T14:00:00Z',
        amount: 30,
        paymentSource: 'Post Office Sales',
        channelId: '948594',
        methodOfPayment: expect.objectContaining({ id: 910400001, label: 'Cash', description: 'Cash' }),
        status: expect.objectContaining({ id: 910400000, label: 'Needs Review', description: 'Needs Review' }),
        dataSource: expect.objectContaining({ id: 910400000, label: 'Post Office Sales', description: 'Post Office Sales' }),
        transactionFile: 'test-pocl-file.xml',
        stateCode: 1,
        errorMessage: '"permissions[0].licensee.email" must be a valid email'
      }

      expect(exception).toMatchObject(expect.objectContaining({ etag: 'W/"56351087"', ...expectedFields }))
    })
  })

  it('maps to dynamics', async () => {
    const validationError = new PoclValidationError()
    validationError.firstName = 'Daniel'
    validationError.lastName = 'Ricciardo'
    validationError.organisation = 'Fishy Endeavours'
    validationError.premises = '14 Howecroft Court'
    validationError.street = 'Eastmead Lane'
    validationError.locality = 'Stoke Bishop'
    validationError.town = 'Bristol'
    validationError.postcode = 'BS9 1HJ'
    validationError.country = 'GB'
    validationError.birthDate = '1989-07-01'
    validationError.email = 'daniel-ricc@example.couk'
    validationError.mobilePhone = '07722 123456'
    validationError.preferredMethodOfConfirmation = optionSetData.defra_preferredcontactmethod.options['910400000']
    validationError.preferredMethodOfNewsletter = optionSetData.defra_preferredcontactmethod.options['910400003']
    validationError.preferredMethodOfReminder = optionSetData.defra_preferredcontactmethod.options['910400002']
    validationError.postalFulfilment = true
    validationError.concessions = '[{"type":"Blue Badge","referenceNumber":123456789}]'
    validationError.startDate = '2021-06-15'
    validationError.serialNumber = '14345-48457J'
    validationError.permitId = 'test-permit-id'
    validationError.transactionDate = '2020-01-01T14:00:00Z'
    validationError.amount = 30
    validationError.paymentSource = 'Post Office Sales'
    validationError.channelId = '948594'
    validationError.methodOfPayment = optionSetData.defra_paymenttype.options['910400001']
    validationError.status = optionSetData.defra_poclvalidationerrorstatus.options['910400000']
    validationError.dataSource = optionSetData.defra_datasource.options['910400000']
    validationError.transactionFile = 'test-pocl-file.xml'
    validationError.stateCode = 1
    validationError.errorMessage = '"permissions[0].licensee.email" must be a valid email'

    const dynamicsEntity = validationError.toRequestBody()
    expect(dynamicsEntity).toMatchSnapshot()
  })
})
