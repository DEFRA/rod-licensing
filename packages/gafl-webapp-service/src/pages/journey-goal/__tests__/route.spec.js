import pageRoute from '../../../routes/page-route.js'
import { JOURNEY_GOAL } from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'
import { journeyGoalResults } from '../result-function.js'
import '../route.js'

jest.mock('../../../routes/page-route.js')
jest.mock('../../../uri.js', () => ({
  ...jest.requireActual('../../../uri.js'),
  JOURNEY_GOAL: { page: 'journey/goal/page', uri: Symbol('/journey/goal/page') }
}))
jest.mock('../../../routes/next-page.js')
jest.mock('../result-function.js', () => ({
  journeyGoalResults: {
    PURCHASE_PERMISSION: Symbol('purchase-permission'),
    RENEW_PERMISSION: Symbol('renew-permission'),
    CANCEL_RECURRING_PAYMENT: Symbol('cancel-recurring-payment')
  }
}))

const getData = pageRoute.mock.calls[0][4]

describe('Journey Goal Page Route', () => {
  it('passes JOURNEY_GOAL.page as view', () => {
    expect(pageRoute).toHaveBeenCalledWith(JOURNEY_GOAL.page, expect.anything(), expect.anything(), expect.anything(), expect.anything())
  })

  it('passes JOURNEY_GOAL.uri as path', () => {
    expect(pageRoute).toHaveBeenCalledWith(expect.anything(), JOURNEY_GOAL.uri, expect.anything(), expect.anything(), expect.anything())
  })

  it('passes function as validator', () => {
    expect(pageRoute).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.any(Function), expect.anything(), expect.anything())
  })

  it('passes nextPage function as completion function', () => {
    expect(pageRoute).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), nextPage, expect.anything())
  })

  it('passes function as getData parameter', () => {
    expect(pageRoute).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.any(Function))
  })

  describe('getData', () => {
    it('returns journey goal data', async () => {
      const data = await getData()
      expect(data).toEqual(expect.objectContaining({ journeyGoals: journeyGoalResults }))
    })
  })
})
