import { getPermissionsTotalCost, getPermissionCost } from '../permissions'

// const getSamplePermit = overrides => ({
//   cost
// })

// const getSamplePermission = ({
//   permit = getSamplePermit()
// }) => ({})

describe('permissions helper', () => {
  it.each`
    desc                                                                                 | totalCost | permits                                                   | permissionOverrides
    ${'three permissions at 5, 10 and 15'}                                               | ${30}     | ${[{ cost: 5 }, { cost: 10 }, { cost: 15 }]}              | ${[]}
    ${'three permissions at 10, 20 and 30'}                                              | ${60}     | ${[{ cost: 10 }, { cost: 20 }, { cost: 30 }]}             | ${[]}
    ${'one permission that should use the new cost of 100'}                              | ${100}    | ${[{ cost: 90, newCost: 100 }]}                           | ${[{ startDate: '2023-04-02' }]}
    ${'one permission that should use the new cost of 80.52'}                            | ${80.52}  | ${[{ cost: 70.99, newCost: 80.52 }]}                      | ${[{ startDate: '2023-04-01' }]}
    ${'one permission using a new cost (80) and one permission using the old cost (40)'} | ${120}    | ${[{ cost: 70, newCost: 80 }, { cost: 40, newCost: 50 }]} | ${[{ startDate: '2023-04-01' }, { startDate: '2023-03-30T23:59:59.999Z' }]}
  `('total cost of permissions is $totalCost with $desc', ({ totalCost, permits, permissionOverrides }) => {
    const permissions = permits.map((permit, idx) => ({
      startDate: '2023-03-30T00:00:00.000Z',
      ...(permissionOverrides[idx] || {}),
      permit: {
        newCost: permit.cost,
        newCostStartDate: '2023-04-01',
        ...permit
      }
    }))
    const transactionCost = getPermissionsTotalCost(permissions)
    expect(transactionCost).toBe(totalCost)
  })

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
