import { findPermit } from '../permit-service.js'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    permits: {
      getAll: async () => [
        {
          id: 'prm-111',
          numberOfRods: 1,
          durationMagnitude: '12',
          durationDesignator: { description: 'M' },
          permitSubtype: { label: 'type-1' }
        },
        {
          id: 'prm-222',
          numberOfRods: 3,
          durationMagnitude: '12',
          durationDesignator: { description: 'M' },
          permitSubtype: { label: 'type-2' }
        },
        {
          id: 'prm-333',
          numberOfRods: 1,
          durationMagnitude: '12',
          durationDesignator: { description: 'M' },
          permitSubtype: { label: 'type-2' }
        },
        {
          id: 'prm-444',
          numberOfRods: 1,
          durationMagnitude: '12',
          durationDesignator: { description: 'M' },
          permitSubtype: { label: 'type-3' }
        }
      ]
    },
    permitConcessions: {
      getAll: async () => [{ permitId: 'prm-111', concessionId: 'con-111' }]
    },
    concessions: {
      getAll: async () => [
        { id: 'con-111', name: 'concession-type-1' },
        { id: 'con-222', name: 'concession-type-2' }
      ]
    }
  }
}))

describe('findPermit', () => {
  const getSamplePermission = overrides => ({
    permit: {
      numberOfRods: '1',
      permitSubtype: {
        label: 'type-3'
      }
    },
    durationMagnitude: '12',
    durationDesignator: { description: 'M' },
    ...overrides
  })
  const getSamplePermissionWithConcession = () => ({
    concessions: [{ type: 'concession-type-1' }],
    permit: {
      numberOfRods: '1',
      permitSubtype: {
        label: 'type-1'
      }
    }
  })

  const createExpectedPermit = ({
    numberOfRods = 1,
    durationMagnitude = '12',
    durationDescription = 'M',
    permitSubtypeLabel = 'type-3',
    ...overrides
  } = {}) => ({
    numberOfRods,
    durationMagnitude,
    durationDesignator: { description: durationDescription },
    permitSubtype: { label: permitSubtypeLabel },
    ...overrides
  })

  it.each`
    description         | expectedPermit                                                                                                              | permission
    ${'concessions'}    | ${createExpectedPermit({ id: 'prm-111', durationMagnitude: '12', durationDescription: 'M', permitSubtypeLabel: 'type-1' })} | ${getSamplePermissionWithConcession()}
    ${'licence type'}   | ${createExpectedPermit({ id: 'prm-444', durationMagnitude: '12', durationDescription: 'M', permitSubtypeLabel: 'type-3' })} | ${getSamplePermission()}
    ${'number of rods'} | ${createExpectedPermit({ id: 'prm-222', numberOfRods: 3, permitSubtypeLabel: 'type-2' })}                                   | ${getSamplePermission({ permit: { permitSubtype: { label: 'type-2' }, numberOfRods: '3' } })}
  `('matches a permission to a permit on $description', async ({ expectedPermit, permission }) => {
    const permit = await findPermit(permission)
    expect(permit).toStrictEqual(expect.objectContaining(expectedPermit))
  })
})
