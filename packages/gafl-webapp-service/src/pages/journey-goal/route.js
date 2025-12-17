import pageRoute from '../../routes/page-route.js'
import { JOURNEY_GOAL } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'
import { journeyGoalResults } from './result-function.js'

const getData = async () => ({
  journeyGoals: journeyGoalResults
})

export default pageRoute(JOURNEY_GOAL.page, JOURNEY_GOAL.uri, () => {}, nextPage, getData)
