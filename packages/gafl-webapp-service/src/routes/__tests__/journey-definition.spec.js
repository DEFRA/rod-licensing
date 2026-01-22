import { CommonResults } from '../../constants'
import { JOURNEY_GOAL, LICENCE_FOR } from '../../uri.js'

jest.mock('../../uri.js', () => {
  const originalModule = jest.requireActual('../../uri.js')
  return {
    ...originalModule,
    JOURNEY_GOAL: Symbol('journey-goal'),
    LICENCE_FOR: Symbol('licence-for')
  }
})

describe('journey-definition', () => {
  it("adds journey goal page as the start page if it's the telesales journey and we're showing the cancellation journey", () => {
    jest.isolateModules(() => {
      process.env.CHANNEL = 'telesales'
      process.env.SHOW_CANCELLATION_JOURNEY = 'true'

      const journeyDefinition = require('../journey-definition.js').default
      const startPage = journeyDefinition.find(page => page.current.page === 'start')
      expect(startPage).toEqual(
        expect.objectContaining({
          current: { page: 'start' },
          next: {
            [CommonResults.OK]: {
              page: JOURNEY_GOAL
            }
          }
        })
      )
    })
  })

  it("sets the licence for page if it's not the telesales journey", () => {
    jest.isolateModules(() => {
      process.env.CHANNEL = 'BBC1'
      process.env.SHOW_CANCELLATION_JOURNEY = 'true'

      const journeyDefinition = require('../journey-definition.js').default
      const startPage = journeyDefinition.find(page => page.current.page === 'start')
      expect(startPage).toEqual(
        expect.objectContaining({
          current: { page: 'start' },
          next: {
            [CommonResults.OK]: {
              page: LICENCE_FOR
            }
          }
        })
      )
    })
  })

  it.each(['false', undefined, null])('sets the licence for page if cancellation journey feature flag is %p', showCancellationJourney => {
    jest.isolateModules(() => {
      process.env.CHANNEL = 'BBC1'
      process.env.SHOW_CANCELLATION_JOURNEY = showCancellationJourney

      const journeyDefinition = require('../journey-definition.js').default
      const startPage = journeyDefinition.find(page => page.current.page === 'start')
      expect(startPage).toEqual(
        expect.objectContaining({
          current: { page: 'start' },
          next: {
            [CommonResults.OK]: {
              page: LICENCE_FOR
            }
          }
        })
      )
    })
  })
})
