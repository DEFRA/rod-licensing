import { PoclValidationError } from '../pocl-validation-error.entity.js'
import { retrieveGlobalOptionSets } from '../..'

describe('pocl staging exception entity', () => {
  let optionSetData
  beforeAll(async () => {
    optionSetData = await retrieveGlobalOptionSets().cached()
  })
  describe('maps from dynamics', () => {
    const getPOCLValidationError = () =>
      PoclValidationError.fromResponse(
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
          defra_country: 'GB-ENG',
          defra_countrylist: 910400195,
          defra_birthdate: '1989-07-01',
          defra_emailaddress: 'daniel-ricc@example.couk',
          defra_mobilenumber: '07722 123456',
          defra_preferredmethodofnewsletter: 910400003,
          defra_preferredmethodofconfirmation: 910400000,
          defra_preferredmethodofreminder: 910400002,
          defra_postalfulfilment: true,
          defra_concessions: '[{"type":"Blue Badge","referenceNumber":123456789}]',
          defra_startdate: '2021-06-15',
          defra_newstartdate: '2021-06-15',
          defra_serialnumber: '14345-48457J',
          defra_permitid: 'test-permit-id',
          defra_transactiondate: '2020-01-01T14:00:00Z',
          defra_amount: 30,
          defra_paymentsource: 'Post Office Sales',
          defra_newpaymentsource: 910400003,
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

    it('returns a PoclValidationError instance', () => {
      expect(getPOCLValidationError()).toBeInstanceOf(PoclValidationError)
    })

    it('has the expected data', () => {
      expect(getPOCLValidationError()).toMatchSnapshot()
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
        countryUnvalidated: 'GB-ENG',
        country: expect.objectContaining({ id: 910400195, label: 'England', description: 'GB-ENG' }),
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
        startDateUnvalidated: '2021-06-15',
        startDate: '2021-06-15',
        serialNumber: '14345-48457J',
        permitId: 'test-permit-id',
        transactionDate: '2020-01-01T14:00:00Z',
        amount: 30,
        paymentSourceUnvalidated: 'Post Office Sales',
        paymentSource: {
          description: 'Worldpay',
          id: 910400003,
          label: 'Worldpay'
        },
        channelId: '948594',
        methodOfPayment: expect.objectContaining({ id: 910400001, label: 'Cash', description: 'Cash' }),
        status: expect.objectContaining({ id: 910400000, label: 'Needs Review', description: 'Needs Review' }),
        dataSource: expect.objectContaining({ id: 910400000, label: 'Post Office Sales', description: 'Post Office Sales' }),
        transactionFile: 'test-pocl-file.xml',
        stateCode: 1,
        errorMessage: '"permissions[0].licensee.email" must be a valid email'
      }
      expect(getPOCLValidationError()).toMatchObject(expect.objectContaining({ etag: 'W/"56351087"', ...expectedFields }))
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
    validationError.countryUnvalidated = 'GB-ENG'
    validationError.country = optionSetData.defra_country.options['910400195']
    validationError.birthDate = '1989-07-01'
    validationError.email = 'daniel-ricc@example.couk'
    validationError.mobilePhone = '07722 123456'
    validationError.preferredMethodOfConfirmation = optionSetData.defra_preferredcontactmethod.options['910400000']
    validationError.preferredMethodOfNewsletter = optionSetData.defra_preferredcontactmethod.options['910400003']
    validationError.preferredMethodOfReminder = optionSetData.defra_preferredcontactmethod.options['910400002']
    validationError.postalFulfilment = true
    validationError.concessions = '[{"type":"Blue Badge","referenceNumber":123456789}]'
    validationError.startDateUnvalidated = '2021-06-15'
    validationError.startDate = '2021-06-15'
    validationError.serialNumber = '14345-48457J'
    validationError.permitId = 'test-permit-id'
    validationError.transactionDate = '2020-01-01T14:00:00Z'
    validationError.amount = 30
    validationError.paymentSourceUnvalidated = 'Post Office Sales'
    validationError.paymentSource = optionSetData.defra_financialtransactionsource.options['910400003']
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
