import { BaseEntity, EntityDefinition } from './base.entity.js'

export class Contact extends BaseEntity {
  static #definition = new EntityDefinition({
    collection: 'contacts',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'contactid', type: 'string' },
      firstName: { field: 'firstname', type: 'string' },
      lastName: { field: 'lastname', type: 'string' },
      birthDate: { field: 'birthdate', type: 'date' },
      email: { field: 'emailaddress1', type: 'string' },
      mobilePhone: { field: 'mobilephone', type: 'string' },
      premises: { field: 'defra_premises', type: 'string' },
      street: { field: 'defra_street', type: 'string' },
      locality: { field: 'defra_locality', type: 'string' },
      town: { field: 'defra_town', type: 'string' },
      postcode: { field: 'defra_postcode', type: 'string' },
      country: { field: 'defra_country', type: 'optionset', ref: 'defra_country' },
      preferredMethodOfContact: { field: 'defra_preferredmethodofcontact', type: 'optionset', ref: 'defra_preferredcontactmethod' },
      gdprMarketingOptIn: { field: 'defra_gdprmarketingpreferenceoptin', type: 'boolean' }
    }
  })

  /** Define mappings between Dynamics entity field and local entity field */
  static get definition () {
    return Contact.#definition
  }

  /** get the firstName of the entity */
  get firstName () {
    return super._getState('firstName')
  }

  /** set the firstName of this entity */
  set firstName (firstName) {
    super._setState('firstName', firstName)
  }

  /** get the lastName of the entity */
  get lastName () {
    return super._getState('lastName')
  }

  /** set the lastName of this entity */
  set lastName (lastName) {
    super._setState('lastName', lastName)
  }

  /** get the birthDate of the entity */
  get birthDate () {
    return super._getState('birthDate')
  }

  /** set the birthDate of this entity */
  set birthDate (birthDate) {
    super._setState('birthDate', birthDate)
  }

  /** get the email of the entity */
  get email () {
    return super._getState('email')
  }

  /** set the email of this entity */
  set email (email) {
    super._setState('email', email)
  }

  /** get the mobilePhone of the entity */
  get mobilePhone () {
    return super._getState('mobilePhone')
  }

  /** set the mobilePhone of this entity */
  set mobilePhone (mobilePhone) {
    super._setState('mobilePhone', mobilePhone)
  }

  /** get the premises of the entity */
  get premises () {
    return super._getState('premises')
  }

  /** set the premises of this entity */
  set premises (premises) {
    super._setState('premises', premises)
  }

  /** get the street of the entity */
  get street () {
    return super._getState('street')
  }

  /** set the email of this entity */
  set street (street) {
    super._setState('street', street)
  }

  /** get the locality of the entity */
  get locality () {
    return super._getState('locality')
  }

  /** set the locality of this entity */
  set locality (locality) {
    super._setState('locality', locality)
  }

  /** get the town of the entity */
  get town () {
    return super._getState('town')
  }

  /** set the town of this entity */
  set town (town) {
    super._setState('town', town)
  }

  /** get the postcode of the entity */
  get postcode () {
    return super._getState('postcode')
  }

  /** set the postcode of this entity */
  set postcode (postcode) {
    super._setState('postcode', postcode)
  }

  /** get the country of the entity */
  get country () {
    return super._getState('country')
  }

  /** set the country of this entity */
  set country (country) {
    super._setState('country', country)
  }

  /** get the preferredMethodOfContact of the entity */
  get preferredMethodOfContact () {
    return super._getState('preferredMethodOfContact')
  }

  /** set the preferredMethodOfContact of this entity */
  set preferredMethodOfContact (preferredMethodOfContact) {
    super._setState('preferredMethodOfContact', preferredMethodOfContact)
  }

  /** get the gdprMarketingOptIn of the entity */
  get gdprMarketingOptIn () {
    return super._getState('gdprMarketingOptIn')
  }

  /** set the gdprMarketingOptIn of this entity */
  set gdprMarketingOptIn (gdprMarketingOptIn) {
    super._setState('gdprMarketingOptIn', gdprMarketingOptIn)
  }
}
