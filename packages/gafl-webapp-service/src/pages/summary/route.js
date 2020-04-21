import pageRoute from '../../routes/page-route.js'
import GetDataRedirect from '../../handlers/get-data-redirect.js'
import getPermit from '../../processors/get-permit.js'
import moment from 'moment'
import crypto from 'crypto'

import {
  SUMMARY,
  CONTROLLER,
  NAME,
  ADDRESS_ENTRY,
  ADDRESS_SELECT,
  ADDRESS_LOOKUP,
  CONTACT,
  NEWSLETTER,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  LICENCE_TO_START
} from '../../constants.js'

import { HOW_CONTACTED } from '../../processors/mapping-constants.js'

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  /*
   * Before we try and filter the permit it is necessary to check that the user has navigated through
   * the journey in such a way as to have gather all the required data. They have have manipulated the
   * journey by typing into the address bar in which case they will be redirected back to the
   * appropriate point in the journey
   */
  if (!status[LICENCE_LENGTH.page]) {
    throw new GetDataRedirect(LICENCE_LENGTH.uri)
  }

  if (!status[LICENCE_TYPE.page]) {
    throw new GetDataRedirect(LICENCE_TYPE.uri)
  }

  if (!permission.numberOfRods) {
    throw new GetDataRedirect(LICENCE_TYPE.uri)
  }

  if (!permission.licenceStartDate) {
    throw new GetDataRedirect(LICENCE_TO_START.uri)
  }

  if (!status[DATE_OF_BIRTH.page]) {
    throw new GetDataRedirect(DATE_OF_BIRTH.uri)
  }

  if (!status[NAME.page]) {
    throw new GetDataRedirect(NAME.uri)
  }

  if (!status[ADDRESS_ENTRY.page] && !status[ADDRESS_SELECT.page]) {
    throw new GetDataRedirect(ADDRESS_LOOKUP.uri)
  }

  if (!status[CONTACT.page]) {
    throw new GetDataRedirect(CONTACT.uri)
  }

  status.fromSummary = true
  await request.cache().helpers.status.setCurrentPermission(status)

  /*
   * To stop repeated reads of the API with users repeatably refreshing the page, the transaction cache stores
   * a hash of itself. If the transaction cache has not changed the permit is not recalculated.
   *
   * The section of the transaction cache subject to the hashing algorithm excludes
   * name, address, or anything not effecting permit filter
   */
  const hashOperand = Object.assign((({ hash, permit, licensee, ...p }) => p)(permission), { concessions: permission.licensee.concessions })

  // To calculate a permit, hash and save
  const addHashAndPermit = async () => {
    const permit = await getPermit(request)
    permission.permit = permit
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(hashOperand))
    permission.hash = hash.digest('hex')
    await request.cache().helpers.transaction.setCurrentPermission(permission)
  }

  if (!permission.hash) {
    await addHashAndPermit()
  } else {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(hashOperand))
    if (hash.digest('hex') !== permission.hash) {
      await addHashAndPermit()
    }
  }

  return {
    permission,
    contactMethod: permission.licensee.preferredMethodOfConfirmation,
    newsLetter: !!permission.licensee.preferredMethodOfNewsletter,
    howContacted: HOW_CONTACTED,
    birthDateStr: moment(permission.licensee.birthDate, 'YYYY-MM-DD').format('DD MM YYYY'),
    uri: {
      name: NAME.uri,
      address: status[ADDRESS_ENTRY.page] ? ADDRESS_ENTRY.uri : ADDRESS_LOOKUP.uri,
      contact: CONTACT.uri,
      newsletter: NEWSLETTER.uri,
      dateOfBirth: DATE_OF_BIRTH.uri
    }
  }
}

export default pageRoute(SUMMARY.page, SUMMARY.uri, null, CONTROLLER.uri, getData)
