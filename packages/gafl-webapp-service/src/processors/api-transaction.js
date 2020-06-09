import moment from 'moment'
import * as mappings from './mapping-constants.js'
import { TRANSACTION_SOURCE, PAYMENT_TYPE } from '@defra-fish/business-rules-lib'
import * as concessionHelper from '../processors/concession-helper.js'
import { countries } from './refdata-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'

const prepareApiTransactionPayload = async request => {
  const transactionCache = await request.cache().helpers.transaction.get()
  const concessions = await salesApi.concessions.getAll()
  const countryList = await countries.getAll()

  return {
    dataSource: mappings.DATA_SOURCE.web,
    permissions: transactionCache.permissions.map(p => {
      const permission = {
        permitId: p.permit.id,
        licensee: Object.assign((({ countryCode, ...l }) => l)(p.licensee), {
          country: countryList.find(c => c.code === p.licensee.countryCode).name
        }),
        issueDate: moment().toISOString(),
        startDate: moment(p.licenceStartDate, 'YYYY-MM-DD')
          .add(p.licenceStartTime, 'hours')
          .toISOString()
      }

      // Calculate the concession (proof entry) - disabl;ed takes precedence
      if (concessionHelper.hasDisabled(p)) {
        permission.concessions = [
          {
            id: concessions.find(c => c.name === mappings.CONCESSION.DISABLED).id,
            proof: p.concessions.find(c => c.type === mappings.CONCESSION.DISABLED).proof
          }
        ]
      } else if (concessionHelper.hasSenior(p)) {
        permission.concessions = [
          {
            id: concessions.find(c => c.name === mappings.CONCESSION.SENIOR).id,
            proof: {
              type: mappings.CONCESSION_PROOF.none
            }
          }
        ]
      } else if (concessionHelper.hasJunior(p)) {
        permission.concessions = [
          {
            id: concessions.find(c => c.name === mappings.CONCESSION.JUNIOR).id,
            proof: {
              type: mappings.CONCESSION_PROOF.none
            }
          }
        ]
      }

      return permission
    })
  }
}

const prepareApiFinalisationPayload = async request => {
  const transaction = await request.cache().helpers.transaction.get()
  return {
    payment: {
      amount: transaction.cost,
      timestamp: moment().toISOString(),
      source: TRANSACTION_SOURCE.govPay,
      method: PAYMENT_TYPE.debit
    }
  }
}

export { prepareApiTransactionPayload, prepareApiFinalisationPayload }
