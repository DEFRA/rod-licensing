import { BLUE_BADGE_CHECK } from '../../../constants.js'
import concessionTransaction from '../shared/concession-transaction.js'
export default async request => concessionTransaction(request, BLUE_BADGE_CHECK, 'blue-badge-check')
