import { BaseEntity, EntityDefinition } from './base.entity.js'
import { Contact } from './contact.entity.js'

export const RCR_ACTIVITY_STATUS = Object.freeze({
  STARTED: 910400000,
  SUBMITTED: 910400001
})

/**
 * RCRActivity entity
 * @extends BaseEntity
 */
export class RCRActivity extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'rcrActivity',
    dynamicsCollection: 'defra_rcractivities',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'activityid', type: 'string' },
      status: { field: 'defra_activitystatus', type: 'integer' },
      season: { field: 'defra_season', type: 'integer' },
      startDate: { field: 'actualstart', type: 'datetime' },
      lastUpdated: { field: 'modifiedon', type: 'datetime' },
      submittedDate: { field: 'actualend', type: 'datetime' }
    },
    relationships: {
      licensee: { property: 'regardingobjectid_contact_defra_rcractivity', entity: Contact, parent: true }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return RCRActivity._definition
  }

  /**
   * The status associated with the rcr activity
   * @type {RCR_ACTIVITY_STATUS}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }

  /**
   * The season associated with the rcr activity
   * @type {number}
   */
  get season () {
    return super._getState('season')
  }

  set season (season) {
    super._setState('season', season)
  }

  /**
   * The start date associated with the rcr activity
   * @type {date}
   */
  get startDate () {
    return super._getState('startDate')
  }

  set startDate (startDate) {
    super._setState('startDate', startDate)
  }

  /**
   * The last updated date associated with the rcr activity
   * @type {date}
   */
  get lastUpdated () {
    return super._getState('lastUpdated')
  }

  /**
   * The submitted date associated with the rcr activity
   * @type {date}
   */
  get submittedDate () {
    return super._getState('submittedDate')
  }

  set submittedDate (submittedDate) {
    super._setState('submittedDate', submittedDate)
  }
}
