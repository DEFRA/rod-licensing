import { getPermissionCost } from '../permissions'

describe('permissions helper', () => {
  it.each`
    desc                                                    | expectedCost | permission
    ${'starting before switch date'}                        | ${1000}      | ${{ startDate: '2023-03-30', permit: { cost: 1000, newCost: 2000 } }}
    ${'starting on switch date'}                            | ${90}        | ${{ startDate: '2023-04-01', permit: { cost: 70, newCost: 90 } }}
    ${'starting after switch date'}                         | ${130}       | ${{ startDate: '2023-04-02', permit: { cost: 110, newCost: 130 } }}
    ${'starting after switch date where price has reduced'} | ${50}        | ${{ startDate: '2023-04-02', permit: { cost: 90, newCost: 50 } }}
  `('gets cost of permission $desc', ({ expectedCost, permission }) => {
    permission.permit.newCostStartDate = '2023-04-01'
    const cost = getPermissionCost(permission)
    expect(cost).toBe(expectedCost)
  })

  it('returns new cost if no start date provided and current date / time is after new cost start date', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-04-02T00:00:00.000Z'))
    const permission = { permit: { cost: 10, newCost: 20, newCostStartDate: '2023-04-01T00:00:00.000' } }
    const cost = getPermissionCost(permission)
    expect(cost).toBe(permission.permit.newCost)
  })

  it('returns old cost if no start date provided and current date / time is before new cost start date', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-03-31T00:00:00.000Z'))
    const permission = { permit: { cost: 10, newCost: 20, newCostStartDate: '2023-04-01T00:00:00.000' } }
    const cost = getPermissionCost(permission)
    expect(cost).toBe(permission.permit.cost)
  })
})
