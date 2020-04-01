import { BENEFIT_CHECK } from '../../../constants.js'
import concessionTransaction from '../shared/concession-transaction.js'
export default async request => concessionTransaction(request, BENEFIT_CHECK, 'benefit-check')
