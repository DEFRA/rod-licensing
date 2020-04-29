import moment from 'moment'
import { permitsOperations } from '../services/sales-api/sales-api-service.js'
import * as mappings from './mapping-constants.js'
import * as concessionHelper from '../processors/concession-helper.js'

const prepareApiTransactionPayload = async request => {
  const transactionCache = await request.cache().helpers.transaction.get()
  const concessions = await permitsOperations.fetchConcessions()

  return {
    dataSource: 'Web Sales',
    permissions: transactionCache.permissions.map(p => {
      const permission = {}
      permission.permitId = p.permit.id
      permission.licensee = p.licensee
      permission.issueDate = moment().toISOString()
      permission.startDate = moment(p.licenceStartDate, 'YYYY-MM-DD')
        .add(p.licenceStartTime, 'hours')
        .toISOString()

      // Calculate the concession (proof entry) - disabl;ed takes precedence
      if (concessionHelper.hasDisabled(p)) {
        permission.concession = {
          concessionId: concessions.find(c => c.name === mappings.CONCESSION.DISABLED).id,
          proof: p.concessions.find(c => c.type === mappings.CONCESSION.DISABLED).proof
        }
      } else if (concessionHelper.hasSenior(p)) {
        permission.concession = {
          concessionId: concessions.find(c => c.name === mappings.CONCESSION.SENIOR).id,
          proof: {
            type: 'No proof'
          }
        }
      } else if (concessionHelper.hasJunior(p)) {
        permission.concession = {
          concessionId: concessions.find(c => c.name === mappings.CONCESSION.JUNIOR).id,
          proof: {
            type: 'No proof'
          }
        }
      }

      // TODO - Remove/fix when dynamics schema changes are done
      permission.licensee.country = 'United Kingdom'
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
      source: 'Gov Pay',
      method: 'Other'
    }
  }
}

export { prepareApiTransactionPayload, prepareApiFinalisationPayload }
