import findPermit from '../find-permit'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    permits: {
      getAll: async () => [
        {
          id: 'prm-111',
          numberOfRods: 1,
          durationMagnitude: '8',
          durationDesignator: { description: 'M' },
          permitSubtype: { label: 'type-1' }
        },
        {
          id: 'prm-222',
          numberOfRods: 1,
          durationMagnitude: '17',
          durationDesignator: { description: 'Seconds' },
          permitSubtype: { label: 'type-2' }
        },
        {
          id: 'prm-333',
          numberOfRods: 1,
          durationMagnitude: '17',
          durationDesignator: { description: 'Seconds' },
          permitSubtype: { label: 'type-3' }
        },
        {
          id: 'prm-444',
          numberOfRods: 1,
          durationMagnitude: '10',
          durationDesignator: { description: 'Hours' },
          permitSubtype: { label: 'type-3' }
        },
        {
          id: 'prm-555',
          numberOfRods: 3,
          durationMagnitude: '10',
          durationDesignator: { description: 'Hours' },
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
    licenceLength: '10Hours',
    licenceType: 'type-3',
    numberOfRods: '1',
    ...overrides
  })
  const getSamplePermissionWithConcession = () => ({
    concessions: [{ type: 'concession-type-1' }],
    licenceLength: '8M',
    licenceType: 'type-1',
    numberOfRods: '1'
  })

  const createExpectedPermit = ({
    numberOfRods = 1,
    durationMagnitude = '10',
    durationDescription = 'Hours',
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
    description         | expectedPermit                                                                                                                    | permission
    ${'concessions'}    | ${createExpectedPermit({ id: 'prm-111', durationMagnitude: '8', durationDescription: 'M', permitSubtypeLabel: 'type-1' })}        | ${getSamplePermissionWithConcession()}
    ${'licence type'}   | ${createExpectedPermit({ id: 'prm-222', durationMagnitude: '17', durationDescription: 'Seconds', permitSubtypeLabel: 'type-2' })} | ${getSamplePermission({ licenceLength: '17Seconds', licenceType: 'type-2' })}
    ${'licence length'} | ${createExpectedPermit({ id: 'prm-444' })}                                                                                        | ${getSamplePermission()}
    ${'number of rods'} | ${createExpectedPermit({ id: 'prm-555', numberOfRods: 3 })}                                                                       | ${getSamplePermission({ numberOfRods: '3' })}
  `('matches a permission to a permit on $description', async ({ expectedPermit, permission }) => {
    const permit = await findPermit(permission)
    expect(permit).toStrictEqual(expect.objectContaining(expectedPermit))
  })
})
