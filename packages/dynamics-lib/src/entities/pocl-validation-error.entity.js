import { BaseEntity, EntityDefinition } from './base.entity.js'

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
      addressOrg: { field: 'defra_addressorg', type: 'string' },
      addressPOBox: { field: 'defra_addresspobox', type: 'string' },
      addressSubPrem: { field: 'defra_addresssubprem', type: 'string' },
      addressBuildName: { field: 'defra_addressbuildname', type: 'string' },
      addressBuildNum: { field: 'defra_addressbuildnum', type: 'string' },
      addressDepthoro: { field: 'defra_addressdepthoro', type: 'string' },
      addressThoro: { field: 'defra_addressthoro', type: 'string' },
      addressLocal: { field: 'defra_addresslocal', type: 'string' },
      addressTown: { field: 'defra_addresstown', type: 'string' },
      addressPostcode: { field: 'defra_addresspostcode', type: 'string' },
      addressPremises: { field: 'defra_addresspremises', type: 'string' },
      addressAddress: { field: 'defra_addressaddress', type: 'string' },
      addressContAddress: { field: 'defra_addresscontaddress', type: 'string' },
      addressTownCity: { field: 'defra_addresstowncity', type: 'string' },
      addressPostcodeZip: { field: 'defra_addresspostcodezip', type: 'string' },
      addressCountry: { field: 'defra_addresscountry', type: 'string' },
      dateOfBirth: { field: 'defra_dateofbirth', type: 'string' },
      seniorId: { field: 'defra_seniorid', type: 'string' },
      disabledId1: { field: 'defra_disabledid1', type: 'string' },
      disabledId2: { field: 'defra_disabledid2', type: 'string' },
      notifyByPost: { field: 'defra_notifybypost', type: 'string' },
      notifyByEmail: { field: 'defra_notifybyemail', type: 'string' },
      notifyBySms: { field: 'defra_notifybysms', type: 'string' },
      notifyEmailAddress: { field: 'defra_notifyemailaddress', type: 'string' },
      notifySmsNumber: { field: 'defra_notifysmsnumber', type: 'string' },
      commsByPost: { field: 'defra_commsbypost', type: 'string' },
      commsByEmail: { field: 'defra_commsbyemail', type: 'string' },
      commsBySms: { field: 'defra_commsbysms', type: 'string' },
      commsEmailAddress: { field: 'defra_commsemailaddress', type: 'string' },
      commsSmsNumber: { field: 'defra_commssmsnumber', type: 'string' },
      licenceCategory: { field: 'defra_licencecategory', type: 'string' },
      licenceType: { field: 'defra_licencetype', type: 'string' },
      startDate: { field: 'defra_startdate', type: 'string' },
      startTime: { field: 'defra_starttime', type: 'string' },
      channelId: { field: 'defra_channelid', type: 'string' },
      serialNo: { field: 'defra_serialno', type: 'string' },
      amount: { field: 'defra_amount', type: 'string' },
      mopex: { field: 'defra_mopex', type: 'string' },
      systemDate: { field: 'defra_systemdate', type: 'string' },
      systemTime: { field: 'defra_systemtime', type: 'string' },
      itemId: { field: 'defra_itemid', type: 'string' },
      status: { field: 'statuscode', type: 'choice' }
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
  get addressOrg () {
    return super._getState('addressOrg')
  }

  set addressOrg (addressOrg) {
    super._setState('addressOrg', addressOrg)
  }

  /**
   * The PO Box in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressPOBox () {
    return super._getState('addressPOBox')
  }

  set addressPOBox (addressPOBox) {
    super._setState('addressPOBox', addressPOBox)
  }

  /**
   * The sub premises in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressSubPrem () {
    return super._getState('addressSubPrem')
  }

  set addressSubPrem (addressSubPrem) {
    super._setState('addressSubPrem', addressSubPrem)
  }

  /**
   * The building name in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressBuildName () {
    return super._getState('addressBuildName')
  }

  set addressBuildName (addressBuildName) {
    super._setState('addressBuildName', addressBuildName)
  }

  /**
   * The building number in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressBuildNum () {
    return super._getState('addressBuildNum')
  }

  set addressBuildNum (addressBuildNum) {
    super._setState('addressBuildNum', addressBuildNum)
  }

  /**
   * The dependent thoroughfare in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressDepthoro () {
    return super._getState('addressDepthoro')
  }

  set addressDepthoro (addressDepthoro) {
    super._setState('addressDepthoro', addressDepthoro)
  }

  /**
   * The thoroughfare in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressThoro () {
    return super._getState('addressThoro')
  }

  set addressThoro (addressThoro) {
    super._setState('addressThoro', addressThoro)
  }

  /**
   * The dependent locality in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressLocal () {
    return super._getState('addressLocal')
  }

  set addressLocal (addressLocal) {
    super._setState('addressLocal', addressLocal)
  }

  /**
   * The post town in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressTown () {
    return super._getState('addressTown')
  }

  set addressTown (addressTown) {
    super._setState('addressTown', addressTown)
  }

  /**
   * The postcode in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressPostcode () {
    return super._getState('addressPostcode')
  }

  set addressPostcode (addressPostcode) {
    super._setState('addressPostcode', addressPostcode)
  }

  /**
   * The premises in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressPremises () {
    return super._getState('addressPremises')
  }

  set addressPremises (addressPremises) {
    super._setState('addressPremises', addressPremises)
  }

  /**
   * The address line 1 in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressAddress () {
    return super._getState('addressAddress')
  }

  set addressAddress (addressAddress) {
    super._setState('addressAddress', addressAddress)
  }

  /**
   * The address line 2 in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressContAddress () {
    return super._getState('addressContAddress')
  }

  set addressContAddress (addressContAddress) {
    super._setState('addressContAddress', addressContAddress)
  }

  /**
   * The town or city in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressTownCity () {
    return super._getState('addressTownCity')
  }

  set addressTownCity (addressTownCity) {
    super._setState('addressTownCity', addressTownCity)
  }

  /**
   * The postcode in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressPostcodeZip () {
    return super._getState('addressPostcodeZip')
  }

  set addressPostcodeZip (addressPostcodeZip) {
    super._setState('addressPostcodeZip', addressPostcodeZip)
  }

  /**
   * The country in the licensee address associated with this pocl record
   * @type {string}
   */
  get addressCountry () {
    return super._getState('addressCountry')
  }

  set addressCountry (addressCountry) {
    super._setState('addressCountry', addressCountry)
  }

  /**
   * The licensee's date of birth associated with this pocl record
   * @type {string}
   */
  get dateOfBirth () {
    return super._getState('dateOfBirth')
  }

  set dateOfBirth (dateOfBirth) {
    super._setState('dateOfBirth', dateOfBirth)
  }

  /**
   * The type of ID shown for senior concession associated with this pocl record
   * @type {string}
   */
  get seniorId () {
    return super._getState('seniorId')
  }

  set seniorId (seniorId) {
    super._setState('seniorId', seniorId)
  }

  /**
   * The Blue Badge number associated with this pocl record
   * @type {string}
   */
  get disabledId1 () {
    return super._getState('disabledId1')
  }

  set disabledId1 (disabledId1) {
    super._setState('disabledId1', disabledId1)
  }

  /**
   * The PIP number associated with this pocl record
   * @type {string}
   */
  get disabledId2 () {
    return super._getState('disabledId2')
  }

  set disabledId2 (disabledId2) {
    super._setState('disabledId2', disabledId2)
  }

  /**
   * The licensee notification by post preference associated with this pocl record
   * @type {string}
   */
  get notifyByPost () {
    return super._getState('notifyByPost')
  }

  set notifyByPost (notifyByPost) {
    super._setState('notifyByPost', notifyByPost)
  }

  /**
   * The licensee notification by email preference associated with this pocl record
   * @type {string}
   */
  get notifyByEmail () {
    return super._getState('notifyByEmail')
  }

  set notifyByEmail (notifyByEmail) {
    super._setState('notifyByEmail', notifyByEmail)
  }

  /**
   * The licensee notification by SMS preference associated with this pocl record
   * @type {string}
   */
  get notifyBySms () {
    return super._getState('notifyBySms')
  }

  set notifyBySms (notifyBySms) {
    super._setState('notifyBySms', notifyBySms)
  }

  /**
   * The licensee email for notifications associated with this pocl record
   * @type {string}
   */
  get notifyEmailAddress () {
    return super._getState('notifyEmailAddress')
  }

  set notifyEmailAddress (notifyEmailAddress) {
    super._setState('notifyEmailAddress', notifyEmailAddress)
  }

  /**
   * The licensee SMS number for notifications associated with this pocl record
   * @type {string}
   */
  get notifySmsNumber () {
    return super._getState('notifySmsNumber')
  }

  set notifySmsNumber (notifySmsNumber) {
    super._setState('notifySmsNumber', notifySmsNumber)
  }

  /**
   * The licensee communication by post preference associated with this pocl record
   * @type {string}
   */
  get commsByPost () {
    return super._getState('commsByPost')
  }

  set commsByPost (commsByPost) {
    super._setState('commsByPost', commsByPost)
  }

  /**
   * The licensee communication by email preference associated with this pocl record
   * @type {string}
   */
  get commsByEmail () {
    return super._getState('commsByEmail')
  }

  set commsByEmail (commsByEmail) {
    super._setState('commsByEmail', commsByEmail)
  }

  /**
   * The licensee communication by SMS preference associated with this pocl record
   * @type {string}
   */
  get commsBySms () {
    return super._getState('commsBySms')
  }

  set commsBySms (commsBySms) {
    super._setState('commsBySms', commsBySms)
  }

  /**
   * The licensee email for communications associated with this pocl record
   * @type {string}
   */
  get commsEmailAddress () {
    return super._getState('commsEmailAddress')
  }

  set commsEmailAddress (commsEmailAddress) {
    super._setState('commsEmailAddress', commsEmailAddress)
  }

  /**
   * The licensee SMS number for communications associated with this pocl record
   * @type {string}
   */
  get commsSmsNumber () {
    return super._getState('commsSmsNumber')
  }

  set commsSmsNumber (commsSmsNumber) {
    super._setState('commsSmsNumber', commsSmsNumber)
  }

  /**
   * The licence category associated with this pocl record
   * @type {string}
   */
  get licenceCategory () {
    return super._getState('licenceCategory')
  }

  set licenceCategory (licenceCategory) {
    super._setState('licenceCategory', licenceCategory)
  }

  /**
   * The licence type associated with this pocl record
   * @type {string}
   */
  get licenceType () {
    return super._getState('licenceType')
  }

  set licenceType (licenceType) {
    super._setState('licenceType', licenceType)
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
   * The licence start time associated with this pocl record
   * @type {string}
   */
  get startTime () {
    return super._getState('startTime')
  }

  set startTime (startTime) {
    super._setState('startTime', startTime)
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
   * The serial no associated with this pocl record
   * @type {string}
   */
  get serialNo () {
    return super._getState('serialNo')
  }

  set serialNo (serialNo) {
    super._setState('serialNo', serialNo)
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
   * The payment type associated with this pocl record
   * @type {string}
   */
  get mopex () {
    return super._getState('mopex')
  }

  set mopex (mopex) {
    super._setState('mopex', mopex)
  }

  /**
   * The transaction date associated with this pocl record
   * @type {string}
   */
  get systemDate () {
    return super._getState('systemDate')
  }

  set systemDate (systemDate) {
    super._setState('systemDate', systemDate)
  }

  /**
   * The transaction time associated with this pocl record
   * @type {string}
   */
  get systemTime () {
    return super._getState('systemTime')
  }

  set systemTime (systemTime) {
    super._setState('systemTime', systemTime)
  }

  /**
   * The item id associated with this pocl record
   * @type {string}
   */
  get itemId () {
    return super._getState('itemId')
  }

  set itemId (itemId) {
    super._setState('itemId', itemId)
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
}
