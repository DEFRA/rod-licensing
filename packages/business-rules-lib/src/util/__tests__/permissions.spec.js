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
})
