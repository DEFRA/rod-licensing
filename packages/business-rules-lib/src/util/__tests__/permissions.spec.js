import { getPermissionCost } from '../permissions'
import { START_AFTER_PAYMENT_MINUTES } from '../../constants'

jest.mock('../../constants.js', () => ({
  START_AFTER_PAYMENT_MINUTES: 34
}))

describe('permissions helper', () => {
  it.each`
    desc                                                                         | expectedCost | permission                                                            | createdDate
    ${'starting before switch date with no created date'}                        | ${1000}      | ${{ startDate: '2023-03-30', permit: { cost: 1000, newCost: 2000 } }} | ${undefined}
    ${'starting on switch date with no created date'}                            | ${90}        | ${{ startDate: '2023-04-01', permit: { cost: 70, newCost: 90 } }}     | ${undefined}
    ${'starting after switch date with no created date'}                         | ${130}       | ${{ startDate: '2023-04-02', permit: { cost: 110, newCost: 130 } }}   | ${undefined}
    ${'starting after switch date where price has reduced with no created date'} | ${50}        | ${{ startDate: '2023-04-02', permit: { cost: 90, newCost: 50 } }}     | ${undefined}
    ${'starting before switch date with created date'}                           | ${1000}      | ${{ permit: { cost: 1000, newCost: 2000 } }}                          | ${'2023-03-30'}
    ${'starting on switch date with created date'}                               | ${90}        | ${{ permit: { cost: 70, newCost: 90 } }}                              | ${'2023-04-01'}
    ${'starting after switch date with created date'}                            | ${130}       | ${{ permit: { cost: 110, newCost: 130 } }}                            | ${'2023-04-02'}
    ${'starting after switch date where price has reduced with created date'}    | ${50}        | ${{ permit: { cost: 90, newCost: 50 } }}                              | ${'2023-04-02'}
  `('gets cost of permission $desc', ({ expectedCost, permission, createdDate }) => {
    permission.permit.newCostStartDate = '2023-04-01'
    const cost = getPermissionCost(permission, createdDate)
    expect(cost).toBe(expectedCost)
  })

  it('returns new cost if no start date provided, no created date provided and current date / time is after new cost start date', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-04-02T00:00:00.000Z'))
    const permission = { permit: { cost: 10, newCost: 20, newCostStartDate: '2023-04-01T00:00:00.000Z' } }
    const cost = getPermissionCost(permission)
    expect(cost).toBe(permission.permit.newCost)
  })

  it('returns old cost if no start date provided, no created date provided and current date / time is before new cost start date', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-03-31T00:00:00.000Z'))
    const permission = { permit: { cost: 10, newCost: 20, newCostStartDate: '2023-04-01T00:00:00.000Z' } }
    const cost = getPermissionCost(permission)
    expect(cost).toBe(permission.permit.cost)
  })

  it.each([START_AFTER_PAYMENT_MINUTES, START_AFTER_PAYMENT_MINUTES - 2, START_AFTER_PAYMENT_MINUTES - 18, 1])(
    'returns new cost if no start date provided, no created date provided and current date / time is %i minutes before new cost start date/time',
    minutesBefore => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date(`2023-04-02T22:${60 - minutesBefore}:00.000Z`))
      const permission = { permit: { cost: 10, newCost: 20, newCostStartDate: '2023-04-02T23:00:00.000Z' } }
      const cost = getPermissionCost(permission)
      expect(cost).toBe(permission.permit.newCost)
    }
  )
})
