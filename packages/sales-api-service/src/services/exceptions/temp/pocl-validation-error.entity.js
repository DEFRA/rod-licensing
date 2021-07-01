import { BaseEntity, EntityDefinition } from '@defra-fish/dynamics-lib/src/entities/base.entity.js'

/**
 * pocl validation error entity
 * @extends BaseEntity
 */
export class PoclValidationError extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'transactionValidationError',
    dynamicsCollection: 'defra_poclvalidationerror',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_poclvalidationerrorid', type: 'string' },
      licenseeForename: { field: 'defra_licenseeforename', type: 'string' },
      licenseeSurname: { field: 'defra_name', type: 'string' },
      organisation: { field: 'defra_organisation', type: 'string' },
      premises: { field: 'defra_premises', type: 'string' },
      street: { field: 'defra_street', type: 'string' },
      locality: { field: 'defra_locality', type: 'string' },
      town: { field: 'defra_town', type: 'string' },
      postcode: { field: 'defra_postcode', type: 'string' },
      country: { field: 'defra_country', type: 'string' },
      birthDate: { field: 'defra_birthdate', type: 'string' },
      emailAddress: { field: 'defra_emailaddress', type: 'string' },
      mobileNumber: { field: 'defra_mobilenumber', type: 'string' },
      preferredMethodOfConfirmation: { field: 'defra_preferredmethodofconfirmation', type: 'optionset', ref: 'defra_preferredcontactmethod' },
      preferredMethodOfNewsletter: { field: 'defra_preferredmethodofnewsletter', type: 'optionset', ref: 'defra_preferredcontactmethod' },
      preferredMethodOfReminder: { field: 'defra_preferredmethodofreminder', type: 'optionset', ref: 'defra_preferredcontactmethod' },
      seniorConcessionId: { field: 'defra_seniorconcessionid', type: 'string' },
      blueBadgeNumber: { field: 'defra_bluebadgenumber', type: 'string' },
      pipReferenceNumber: { field: 'defra_pipreferencenumber', type: 'string' },
      startDate: { field: 'defra_startdate', type: 'string' },
      serialNumber: { field: 'defra_serialnumber', type: 'string' },
      permitId: { field: 'defra_permitid', type: 'string' },
      transactionDate: { field: 'defra_transactiondate', type: 'string' },
      amount: { field: 'defra_amount', type: 'string' },
      paymentSource: { field: 'defra_paymentsource', type: 'string' },
      channelId: { field: 'defra_channelid', type: 'string' },
      methodOfPayment: { field: 'defra_methodofpayment', type: 'optionset', ref: 'defra_paymenttype' },
      status: { field: 'defra_status', type: 'optionset', ref: 'defra_poclvalidationerrorstatus' },
      dataSource: { field: 'defra_datasource', type: 'optionset', ref: 'defra_datasource' }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return PoclValidationError._definition
  }

  /**
   * The licensee forename associated with this pocl record
   * @type {string}
   */
  get licenseeForename () {
    return super._getState('licenseeForename')
  }

  set licenseeForename (licenseeForename) {
    super._setState('licenseeForename', licenseeForename)
  }

  /**
   * The licensee surname associated with this pocl record
   * @type {string}
   */
  get licenseeSurname () {
    return super._getState('licenseeSurname')
  }

  set licenseeSurname (licenseeSurname) {
    super._setState('licenseeSurname', licenseeSurname)
  }

  /**
   * The organisation in the licensee address associated with this pocl record
   * @type {string}
   */
  get organisation () {
    return super._getState('organisation')
  }

  set organisation (organisation) {
    super._setState('organisation', organisation)
  }

  /**
   * The locality in the licensee address associated with this pocl record
   * @type {string}
   */
  get locality () {
    return super._getState('locality')
  }

  set locality (locality) {
    super._setState('locality', locality)
  }

  /**
   * The town in the licensee address associated with this pocl record
   * @type {string}
   */
  get town () {
    return super._getState('town')
  }

  set town (town) {
    super._setState('town', town)
  }

  /**
   * The postcode in the licensee address associated with this pocl record
   * @type {string}
   */
  get postcode () {
    return super._getState('postcode')
  }

  set postcode (postcode) {
    super._setState('postcode', postcode)
  }

  /**
   * The premises in the licensee address associated with this pocl record
   * @type {string}
   */
  get premises () {
    return super._getState('premises')
  }

  set premises (premises) {
    super._setState('premises', premises)
  }

  /**
   * The country in the licensee address associated with this pocl record
   * @type {string}
   */
  get country () {
    return super._getState('country')
  }

  set country (country) {
    super._setState('country', country)
  }

  /**
   * The licensee's date of birth associated with this pocl record
   * @type {string}
   */
  get birthDate () {
    return super._getState('birthDate')
  }

  set birthDate (birthDate) {
    super._setState('birthDate', birthDate)
  }

  /**
   * The licensee's email address associated with this pocl record
   * @type {string}
   */
  get emailAddress () {
    return super._getState('emailAddress')
  }

  set emailAddress (emailAddress) {
    super._setState('emailAddress', emailAddress)
  }

  /**
   * The licensee's mobile number associated with this pocl record
   * @type {string}
   */
  get mobileNumber () {
    return super._getState('mobileNumber')
  }

  set mobileNumber (mobileNumber) {
    super._setState('mobileNumber', mobileNumber)
  }

  /**
   * The licensee's preferred method of confirmation associated with this pocl record
   * @type {GlobalOptionSetDefinition}
   */
  get preferredMethodOfConfirmation () {
    return super._getState('preferredMethodOfConfirmation')
  }

  set preferredMethodOfConfirmation (preferredMethodOfConfirmation) {
    super._setState('preferredMethodOfConfirmation', preferredMethodOfConfirmation)
  }

  /**
   * The licensee's preferred method of newsletter associated with this pocl record
   * @type {GlobalOptionSetDefinition}
   */
  get preferredMethodOfNewsletter () {
    return super._getState('preferredMethodOfNewsletter')
  }

  set preferredMethodOfNewsletter (preferredMethodOfNewsletter) {
    super._setState('preferredMethodOfNewsletter', preferredMethodOfNewsletter)
  }

  /**
   * The licensee's preferred method of reminder associated with this pocl record
   * @type {GlobalOptionSetDefinition}
   */
  get preferredMethodOfReminder () {
    return super._getState('preferredMethodOfReminder')
  }

  set preferredMethodOfReminder (preferredMethodOfReminder) {
    super._setState('preferredMethodOfReminder', preferredMethodOfReminder)
  }

  /**
   * The type of ID shown for senior concession associated with this pocl record
   * @type {string}
   */
  get seniorConcessionId () {
    return super._getState('seniorConcessionId')
  }

  set seniorConcessionId (seniorConcessionId) {
    super._setState('seniorConcessionId', seniorConcessionId)
  }

  /**
   * The Blue Badge number associated with this pocl record
   * @type {string}
   */
  get blueBadgeNumber () {
    return super._getState('blueBadgeNumber')
  }

  set blueBadgeNumber (blueBadgeNumber) {
    super._setState('blueBadgeNumber', blueBadgeNumber)
  }

  /**
   * The PIP reference number associated with this pocl record
   * @type {string}
   */
  get pipReferenceNumber () {
    return super._getState('pipReferenceNumber')
  }

  set pipReferenceNumber (pipReferenceNumber) {
    super._setState('pipReferenceNumber', pipReferenceNumber)
  }

  /**
   * The licence start date associated with this pocl record
   * @type {string}
   */
  get startDate () {
    return super._getState('startDate')
  }

  set startDate (startDate) {
    super._setState('startDate', startDate)
  }

  /**
   * The serial number associated with this pocl record
   * @type {string}
   */
  get serialNumber () {
    return super._getState('serialNumber')
  }

  set serialNumber (serialNumber) {
    super._setState('serialNumber', serialNumber)
  }

  /**
   * The permit id associated with this pocl record
   * @type {string}
   */
  get permitId () {
    return super._getState('permitId')
  }

  set permitId (permitId) {
    super._setState('permitId', permitId)
  }

  /**
   * The licence transaction date associated with this pocl record
   * @type {string}
   */
  get transactionDate () {
    return super._getState('transactionDate')
  }

  set transactionDate (transactionDate) {
    super._setState('transactionDate', transactionDate)
  }

  /**
   * The cost of the transaction associated with this pocl record
   * @type {string}
   */
  get amount () {
    return super._getState('amount')
  }

  set amount (amount) {
    super._setState('amount', amount)
  }

  /**
   * The payment source associated with this pocl record
   * @type {string}
   */
  get paymentSource () {
    return super._getState('paymentSource')
  }

  set paymentSource (paymentSource) {
    super._setState('paymentSource', paymentSource)
  }

  /**
   * The channel id associated with this pocl record
   * @type {string}
   */
  get channelId () {
    return super._getState('channelId')
  }

  set channelId (channelId) {
    super._setState('channelId', channelId)
  }

  /**
   * The method of payment associated with this pocl record
   * @type {string}
   */
  get methodOfPayment () {
    return super._getState('methodOfPayment')
  }

  set methodOfPayment (methodOfPayment) {
    super._setState('methodOfPayment', methodOfPayment)
  }

  /**
   * The status of the pocl validation error record
   * @type {GlobalOptionSetDefinition}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }

  /**
   * The data source of the pocl validation error record
   * @type {GlobalOptionSetDefinition}
   */
  get dataSource () {
    return super._getState('dataSource')
  }

  set dataSource (dataSource) {
    super._setState('dataSource', dataSource)
  }
}
