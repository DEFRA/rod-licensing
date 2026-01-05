import pageRoute from '../../../routes/page-route.js'
import { JOURNEY_GOAL } from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'
import { journeyGoalResults } from '../result-function.js'
import Joi from 'joi'
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
jest.mock('joi', () => ({
  object: jest.fn(() => ({ options: jest.fn(() => () => {}) })),
  string: jest.fn(() => ({ valid: jest.fn(() => ({ required: jest.fn(() => true) })) }))
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

  describe('validator', () => {
    it('specifies journey-goal as key in config', () => {
      expect(Joi.object).toHaveBeenCalledWith({
        'journey-goal': expect.anything()
      })
    })

    it('specifies all values of JOURNEY_GOAL_RESULTS as valid options', () => {
      expect(Joi.string.mock.results[0].value.valid).toHaveBeenCalledWith(expect.arrayContaining(Object.values(journeyGoalResults)))
    })

    it('sets journey-goal to be return value of string().valid().required()', () => {
      jest.isolateModules(() => {
        const requiredReturnValue = Symbol('required-return-value')
        Joi.string.mockReturnValueOnce({ valid: () => ({ required: () => requiredReturnValue }) })
        require('../route.js')
        expect(Joi.object).toHaveBeenCalledWith({
          'journey-goal': requiredReturnValue
        })
      })
    })

    it('sets expected options on the validator', () => {
      expect(Joi.object.mock.results[0].value.options).toHaveBeenCalledWith({ abortEarly: false, allowUnknown: true })
    })

    it('passes Joi object as validator to pageRoute', () => {
      jest.isolateModules(() => {
        const validatorSymbol = Symbol('validator-symbol')
        Joi.object.mockReturnValueOnce({ options: () => validatorSymbol })
        require('../route.js')
        expect(pageRoute.mock.calls[pageRoute.mock.calls.length - 1][2]).toBe(validatorSymbol)
      })
    })
  })
})
