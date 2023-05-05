import { Concession, ConcessionProof, Contact, Permission, Permit, TransactionCurrency } from '@defra-fish/dynamics-lib'
import { readFileSync } from 'fs'
import Project from '../project.cjs'
import Path from 'path'
import moment from 'moment'

const optionSetDataPath = Path.join(Project.root, '..', 'dynamics-lib', 'src', '__mocks__', 'option-set-data.json')
const optionSetData = JSON.parse(readFileSync(optionSetDataPath, { encoding: 'UTF-8' })).value.reduce(
  (acc, { Name: name, Options: options }) => {
    acc[name] = {
      name,
      options: options.reduce((optionSetMapping, o) => {
        const id = o.Value
        const label = o.Label?.UserLocalizedLabel?.Label || ''
        const description = o.Description?.UserLocalizedLabel?.Label || label
        optionSetMapping[id] = { id, label, description }
        return optionSetMapping
      }, {})
    }
    return acc
  },
  {}
)

const testExecutionTime = moment()
export const MOCK_PERMISSION_NUMBER = '11100420-2WT1SFT-KPMW2C'
export const MOCK_OBFUSCATED_DOB = '87200001013460'
export const MOCK_START_DATE = testExecutionTime.toISOString()
export const MOCK_END_DATE = testExecutionTime.add(1, 'year').toISOString()
export const MOCK_ISSUE_DATE = testExecutionTime.toISOString()

export const mockContactPayload = () => ({
  firstName: 'Fester',
  lastName: 'Tester',
  birthDate: '2000-01-01',
  email: 'person@example.com',
  mobilePhone: '+44 7700 900088',
  premises: 'Example House',
  street: 'Example Street',
  locality: 'Near Sample',
  town: 'Exampleton',
  postcode: 'AB12 3CD',
  country: 'GB-ENG',
  preferredMethodOfConfirmation: 'Text',
  preferredMethodOfNewsletter: 'Email',
  preferredMethodOfReminder: 'Letter',
  postalFulfilment: true,
  obfuscatedDob: MOCK_OBFUSCATED_DOB
})

export const mockContactWithIdPayload = () => ({
  id: '1329a866-d175-ea11-a811-000d3a64905b',
  ...mockContactPayload()
})

export const mockPermissionPayload = () => ({
  permitId: MOCK_12MONTH_DISABLED_PERMIT.id,
  licensee: mockContactPayload(),
  concessions: [
    {
      id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
      proof: {
        type: 'National Insurance Number',
        referenceNumber: 'AB 01 02 03 CD'
      }
    }
  ],
  issueDate: MOCK_ISSUE_DATE,
  startDate: MOCK_START_DATE,
  isRenewal: false
})

export const mockTransactionPayload = () => ({
  permissions: [mockPermissionPayload()],
  serialNumber: '559136-2-27950',
  dataSource: 'Web Sales'
})

export const mockFinalisedPermissionRecord = () => ({
  ...mockPermissionPayload(),
  referenceNumber: MOCK_PERMISSION_NUMBER,
  endDate: MOCK_END_DATE
})

export const mockStagedTransactionRecord = () => ({
  id: 'b364c12f-ce62-4c62-b4bd-4a06fd57e256',
  expires: 1586512428,
  ...mockTransactionPayload(),
  cost: 30,
  isRecurringPaymentSupported: true,
  status: { id: 'STAGED' }
})

export const mockFinalisedTransactionRecord = () => ({
  id: 'b364c12f-ce62-4c62-b4bd-4a06fd57e256',
  serialNumber: '559136-2-27950',
  expires: 1586512428,
  permissions: [mockFinalisedPermissionRecord()],
  cost: 30,
  dataSource: 'Web Sales',
  isRecurringPaymentSupported: true,
  payment: {
    amount: 30,
    source: 'Gov Pay',
    method: 'Debit card',
    timestamp: new Date().toISOString()
  },
  status: {
    id: 'FINALISED'
  }
})

export const MOCK_CONCESSION_DYNAMICS_RESPONSE = {
  '@odata.etag': 'W/"22638892"',
  defra_name: 'Senior',
  defra_concessionid: 'd0ece997-ef65-e611-80dc-c4346bad4004'
}
export const MOCK_CONCESSION = Concession.fromResponse(MOCK_CONCESSION_DYNAMICS_RESPONSE, optionSetData)

export const MOCK_TRANSACTION_CURRENCY = TransactionCurrency.fromResponse(
  {
    '@odata.etag': 'W/"556963"',
    currencyname: 'Pound Sterling',
    isocurrencycode: 'GBP',
    currencysymbol: '£',
    transactioncurrencyid: 'd0d0b0f4-f5e0-e711-810d-5065f38a8bc1'
  },
  optionSetData
)

export const MOCK_1DAY_SENIOR_PERMIT_DYNAMICS_RESPONSE = {
  '@odata.etag': 'W/"51026144"',
  defra_availablefrom: '2017-03-31T23:00:00Z',
  defra_availableto: '2021-03-31T22:59:00Z',
  defra_durationnumericpart: 1,
  defra_durationdaymonthyearpart: 910400000,
  defra_numberofrods: 2,
  defra_permittype: 910400000,
  defra_advertisedprice: 6.0,
  defra_datasource: 910400002,
  defra_permitid: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
  defra_name: 'Coarse 1 day 2 Rod Licence (Senior)',
  defra_permitsubtype: 910400001,
  defra_isforfulfilment: false,
  defra_iscountersales: true,
  defra_recurringsupported: false,
  defra_itemid: '42290'
}

export const MOCK_1DAY_FULL_PERMIT_DYNAMICS_RESPONSE = {
  '@odata.etag': 'W/"22639016"',
  defra_availablefrom: '2017-03-31T23:00:00Z',
  defra_availableto: '2020-03-31T22:59:00Z',
  defra_durationnumericpart: 1,
  defra_durationdaymonthyearpart: 910400000,
  defra_permittype: 910400000,
  defra_advertisedprice: 6.0,
  defra_permitid: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
  defra_name: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
  defra_permitsubtype: 910400001,
  defra_numberofrods: 2,
  defra_isforfulfilment: false,
  defra_iscountersales: true,
  defra_recurringsupported: false,
  defra_itemid: '42289'
}

export const MOCK_1DAY_SENIOR_PERMIT_ENTITY = Permit.fromResponse(MOCK_1DAY_SENIOR_PERMIT_DYNAMICS_RESPONSE, optionSetData)
export const MOCK_1DAY_FULL_PERMIT_ENTITY = Permit.fromResponse(MOCK_1DAY_FULL_PERMIT_DYNAMICS_RESPONSE, optionSetData)

export const MOCK_12MONTH_SENIOR_PERMIT_DYNAMICS_RESPONSE = {
  '@odata.etag': 'W/"51026180"',
  defra_availablefrom: '2017-03-31T23:00:00Z',
  defra_availableto: '2021-03-31T22:59:00Z',
  defra_durationnumericpart: 12,
  defra_durationdaymonthyearpart: 910400001,
  defra_numberofrods: 3,
  defra_permittype: 910400000,
  defra_advertisedprice: 30.0,
  defra_datasource: 910400002,
  defra_permitid: 'cb1b34a0-0c66-e611-80dc-c4346bad0190',
  defra_name: 'Coarse 12 month 3 Rod Licence (Senior, Disabled)',
  defra_permitsubtype: 910400001,
  defra_isforfulfilment: true,
  defra_iscountersales: true,
  defra_recurringsupported: true,
  defra_itemid: '42347'
}
export const MOCK_12MONTH_DISABLED_PERMIT_DYNAMICS_RESPONSE = {
  '@odata.etag': 'W/"51026198"',
  defra_availablefrom: '2017-03-31T23:00:00Z',
  defra_availableto: '2021-03-31T22:59:00Z',
  defra_durationnumericpart: 12,
  defra_durationdaymonthyearpart: 910400001,
  defra_numberofrods: 1,
  defra_permittype: 910400000,
  defra_advertisedprice: 54.0,
  defra_datasource: 910400002,
  defra_permitid: 'e11b34a0-0c66-e611-80dc-c4346bad0190',
  defra_name: 'Salmon 12 month 1 Rod Licence (Full, Disabled)',
  defra_permitsubtype: 910400000,
  defra_isforfulfilment: true,
  defra_iscountersales: true,
  defra_recurringsupported: true,
  defra_itemid: '42376'
}

export const MOCK_12MONTH_SENIOR_PERMIT = Permit.fromResponse(MOCK_12MONTH_SENIOR_PERMIT_DYNAMICS_RESPONSE, optionSetData)
export const MOCK_12MONTH_DISABLED_PERMIT = Permit.fromResponse(MOCK_12MONTH_DISABLED_PERMIT_DYNAMICS_RESPONSE, optionSetData)

export const MOCK_CONCESSION_PROOF_ENTITY = ConcessionProof.fromResponse(
  {
    '@odata.etag': 'W/"53050428"',
    defra_concessionproofid: 'ee336a19-417e-ea11-a811-000d3a64905b',
    defra_referencenumber: 'AB 01 02 03 CD',
    defra_concessionprooftype: 910400001
  },
  optionSetData
)

export const MOCK_EXISTING_PERMISSION_DYNAMICS_RESPONSE = {
  '@odata.etag': 'W/"186695153"',
  defra_permissionid: '347a9083-361e-ea11-a810-000d3a25c5d6',
  defra_name: '00000000-2WC3FDR-CD379B',
  defra_issuedate: '2019-12-13T09:00:00Z',
  defra_startdate: '2019-12-14T00:00:00Z',
  defra_enddate: '2020-12-13T23:59:59Z',
  defra_stagingid: '71ad9a25-2a03-406b-a0e3-f4ff37799374',
  defra_datasource: 910400003
}

export const MOCK_EXISTING_PERMISSION_ENTITY = Permission.fromResponse(MOCK_EXISTING_PERMISSION_DYNAMICS_RESPONSE, optionSetData)

export const MOCK_NEW_CONTACT_ENTITY = new Contact()

export const MOCK_EXISTING_CONTACT_ENTITY = Contact.fromResponse(
  {
    '@odata.etag': 'W/"202465000"',
    contactid: '1329a866-d175-ea11-a811-000d3a64905b',
    firstname: 'Fester',
    lastname: 'Tester',
    birthdate: '1946-01-01',
    emailaddress1: 'fester@tester.com',
    mobilephone: '01234 567890',
    defra_organisation: 'Test Organisation',
    defra_premises: '1',
    defra_street: 'Tester Avenue',
    defra_locality: 'Testville',
    defra_town: 'Tersterton',
    defra_postcode: 'AB12 3CD',
    defra_country: 910400195,
    defra_postalfulfilment: true,
    defra_preferredmethodofconfirmation: 910400000
  },
  optionSetData
)

export const mockPermit = () => ({
  durationMagnitude: 12,
  durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' }
})
