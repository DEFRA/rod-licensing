import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * pocl validation error entity
 * @extends BaseEntity
 */
export class PoclValidationError extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'transactionValidationError',
    dynamicsCollection: 'defra_poclvalidationerrors',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_poclvalidationerrorid', type: 'string' },
      firstName: { field: 'defra_firstname', type: 'string' },
      lastName: { field: 'defra_name', type: 'string' },
      birthDate: { field: 'defra_birthdate', type: 'string' },
      countryUnvalidated: { field: 'defra_country', type: 'string' },
      country: { field: 'defra_countrylist', type: 'optionset', ref: 'defra_country' },
      postcode: { field: 'defra_postcode', type: 'string' },
      town: { field: 'defra_town', type: 'string' },
      locality: { field: 'defra_locality', type: 'string' },
      street: { field: 'defra_street', type: 'string' },
      premises: { field: 'defra_premises', type: 'string' },
      organisation: { field: 'defra_organisation', type: 'string' },
      mobilePhone: { field: 'defra_mobilenumber', type: 'string' },
      email: { field: 'defra_emailaddress', type: 'string' },
      preferredMethodOfReminder: { field: 'defra_preferredmethodofreminder', type: 'optionset', ref: 'defra_preferredcontactmethod' },
      preferredMethodOfNewsletter: { field: 'defra_preferredmethodofnewsletter', type: 'optionset', ref: 'defra_preferredcontactmethod' },
      preferredMethodOfConfirmation: {
        field: 'defra_preferredmethodofconfirmation',
        type: 'optionset',
        ref: 'defra_preferredcontactmethod'
      },
      postalFulfilment: { field: 'defra_postalfulfilment', type: 'boolean' },
      concessions: { field: 'defra_concessions', type: 'string' },
      startDateUnvalidated: { field: 'defra_startdate', type: 'string' },
      startDate: { field: 'defra_newstartdate', type: 'string' },
      serialNumber: { field: 'defra_serialnumber', type: 'string' },
      permitId: { field: 'defra_permitid', type: 'string' },
      transactionDate: { field: 'defra_transactiondate', type: 'string' },
      amount: { field: 'defra_amount', type: 'decimal' },
      paymentSourceUnvalidated: { field: 'defra_paymentsource', type: 'string' },
      paymentSource: { field: 'defra_newpaymentsource', type: 'optionset', ref: 'defra_financialtransactionsource' },
      channelId: { field: 'defra_channelid', type: 'string' },
      methodOfPayment: { field: 'defra_methodofpayment', type: 'optionset', ref: 'defra_paymenttype' },
      status: { field: 'defra_status', type: 'optionset', ref: 'defra_poclvalidationerrorstatus' },
      dataSource: { field: 'defra_datasource', type: 'optionset', ref: 'defra_datasource' },
      errorMessage: { field: 'defra_errormessage', type: 'string' },
      transactionFile: { field: 'defra_transactionfile', type: 'string' },
      stateCode: { field: 'statecode', type: 'decimal' }
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
  get firstName () {
    return super._getState('firstName')
  }

  set firstName (firstName) {
    super._setState('firstName', firstName)
  }

  /**
   * The licensee surname associated with this pocl record
   * @type {string}
   */
  get lastName () {
    return super._getState('lastName')
  }

  set lastName (lastName) {
    super._setState('lastName', lastName)
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
   * The country in the licensee address associated with this pocl record
   * @type {string}
   */
  get countryUnvalidated () {
    return super._getState('countryUnvalidated')
  }

  set countryUnvalidated (countryUnvalidated) {
    super._setState('countryUnvalidated', countryUnvalidated)
  }

  get country () {
    return super._getState('country')
  }

  set country (country) {
    super._setState('country', country)
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
   * The street in the licensee address associated with this pocl record
   * @type {string}
   */
  get street () {
    return super._getState('street')
  }

  set street (street) {
    super._setState('street', street)
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
   * The licensee's mobile number associated with this pocl record
   * @type {string}
   */
  get mobilePhone () {
    return super._getState('mobilePhone')
  }

  set mobilePhone (mobilePhone) {
    super._setState('mobilePhone', mobilePhone)
  }

  /**
   * The licensee's email address associated with this pocl record
   * @type {string}
   */
  get email () {
    return super._getState('email')
  }

  set email (email) {
    super._setState('email', email)
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
   * The postal fulfilment flag with this pocl record
   * @type {boolean}
   */
  get postalFulfilment () {
    return super._getState('postalFulfilment')
  }

  set postalFulfilment (postalFulfilment) {
    super._setState('postalFulfilment', postalFulfilment)
  }

  /**
   * The concessions associated with this pocl record
   * @type {string}
   */
  get concessions () {
    return super._getState('concessions')
  }

  set concessions (concessions) {
    super._setState('concessions', concessions)
  }

  /**
   * The licence start date associated with this pocl record
   * @type {string}
   */
  get startDateUnvalidated () {
    return super._getState('startDateUnvalidated')
  }

  set startDateUnvalidated (startDateUnvalidated) {
    super._setState('startDateUnvalidated', startDateUnvalidated)
  }

  /**
   * The licence new start date associated with this pocl record
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
   * @type {GlobalOptionSetDefinition}
   */
  get paymentSource () {
    return super._getState('paymentSource')
  }

  set paymentSource (paymentSource) {
    super._setState('paymentSource', paymentSource)
  }

  /**
   * The new payment source associated with this pocl record
   * @type {string}
   */
  get paymentSourceUnvalidated () {
    return super._getState('paymentSourceUnvalidated')
  }

  set paymentSourceUnvalidated (paymentSourceUnvalidated) {
    super._setState('paymentSourceUnvalidated', paymentSourceUnvalidated)
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

  /**
   * The error message associated with this pocl record
   * @type {string}
   */
  get errorMessage () {
    return super._getState('errorMessage')
  }

  set errorMessage (errorMessage) {
    super._setState('errorMessage', errorMessage)
  }

  /**
   * The name of the POCL file associated with this pocl record
   * @type {string}
   */
  get transactionFile () {
    return super._getState('transactionFile')
  }

  set transactionFile (transactionFile) {
    super._setState('transactionFile', transactionFile)
  }

  /**
   * The state code of the pocl validation error record
   * @type {LocalOptionSetDefinition}
   */
  get stateCode () {
    return super._getState('stateCode')
  }

  set stateCode (stateCode) {
    super._setState('stateCode', stateCode)
  }
}
