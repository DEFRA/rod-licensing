import { findPermit } from '../permit.service.js'
import { Permit, Concession, PermitConcession } from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntity } from '../reference-data.service.js'

jest.mock('../reference-data.service.js')

const getSamplePermits = () => {
  const samplePermits = [
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
  return samplePermits.map(sp => ({
    ...sp,
    toJSON: function () { 
      const props = {
        ...this
      }
      delete props.toJSON
      return props
    }
  }))
}

const getSamplePermitConcessions = () => [{ permitId: 'prm-111', concessionId: 'con-111' }]

const getSampleConcessions = () => [
  { id: 'con-111', name: 'concession-type-1' },
  { id: 'con-222', name: 'concession-type-2' }
]

describe('findPermit', () => {
  beforeAll(() => {
    getReferenceDataForEntity.mockImplementation(async entity => {
      if (entity === Permit) {
        return getSamplePermits()
      }
      if (entity === PermitConcession) {
        return getSamplePermitConcessions()
      }
      if (entity === Concession) {
        return getSampleConcessions()
      }
      return []
    })
  })
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
    concessions: [{ name: 'concession-type-1', id: 'abc-123', proof: {}}],
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
    description         | expectedPermit                                                                            | permission
    ${'concessions'}    | ${createExpectedPermit({ id: 'prm-111', permitSubtypeLabel: 'type-1' })}                  | ${getSamplePermissionWithConcession()}
    ${'licence type'}   | ${createExpectedPermit({ id: 'prm-444', permitSubtypeLabel: 'type-3' })}                  | ${getSamplePermission()}
    ${'number of rods'} | ${createExpectedPermit({ id: 'prm-222', numberOfRods: 3, permitSubtypeLabel: 'type-2' })} | ${getSamplePermission({ permit: { permitSubtype: { label: 'type-2' }, numberOfRods: '3' } })}
  `('matches a permission to a permit on $description', async ({ expectedPermit, permission }) => {
    const permit = await findPermit(permission)
    expect(permit).toStrictEqual(expect.objectContaining(expectedPermit))
  })

  it.each([
    ['with one element', [{ type: 'concession-type-1', id: 'con-111', proof: {}}]],
    ['with two elements, one', [{ name: 'concession-type-1', id: 'con-111', proof: {}}, { type: 'concession-type-2', id: 'abc-123', proof: {}}]]
  ])('throws an error if concessions array %s containing type rather than name', async (_d, concessions) => {
    const perm = getSamplePermissionWithConcession()
    perm.concessions = concessions
    await expect(() => findPermit(perm)).rejects.toThrow("Concession should contain 'name' not 'type'")
  })
})
