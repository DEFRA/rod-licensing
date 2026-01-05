import pageRoute from '../../routes/page-route.js'
import { JOURNEY_GOAL } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'
import { journeyGoalResults } from './result-function.js'
import Joi from 'joi'

const getData = async () => ({
  journeyGoals: journeyGoalResults
})

export const validator = Joi.object({
  'journey-goal': Joi.string().valid(Object.values(journeyGoalResults)).required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(JOURNEY_GOAL.page, JOURNEY_GOAL.uri, validator, nextPage, getData)
