import { pricingDetail } from '../pricing-summary.js'

jest.mock('../filter-permits.js', () => ({
  getPermitsJoinPermitConcessions: () => [
    {
      id: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 1 day 2 Rod Licence (Full)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 1,
      concessions: [],
      cost: 6
    },
    {
      id: '9f1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 1 day 2 Rod Licence (Senior)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 1,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        }
      ],
      cost: 6
    },
    {
      id: 'a51b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 1 day 1 Rod Licence (Full)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 1,
      concessions: [],
      cost: 12
    },
    {
      id: 'a71b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 1 day 1 Rod Licence (Senior)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 1,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        }
      ],
      cost: 12
    },
    {
      id: 'a91b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 8 day 2 Rod Licence (Full)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 8,
      concessions: [],
      cost: 12
    },
    {
      id: 'ab1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 8 day 2 Rod Licence (Senior)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 8,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        }
      ],
      cost: 12
    },
    {
      id: 'b11b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 8 day 1 Rod Licence (Full) ',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 8,
      concessions: [],
      cost: 27
    },
    {
      id: 'b31b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 8 day 1 Rod Licence (Senior) ',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 8,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        }
      ],
      cost: 27
    },
    {
      id: 'b51b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 2 Rod Licence (Junior)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: '3230c68f-ef65-e611-80dc-c4346bad4004',
          name: 'Junior'
        }
      ],
      cost: 0
    },
    {
      id: 'b71b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 2 Rod Licence (Full)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [],
      cost: 30
    },
    {
      id: 'b91b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 2 Rod Licence (Senior)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        }
      ],
      cost: 20
    },
    {
      id: 'bb1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 2 Rod Licence (Junior, Disabled)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: '3230c68f-ef65-e611-80dc-c4346bad4004',
          name: 'Junior'
        },
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 0
    },
    {
      id: 'bd1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 2 Rod Licence (Full, Disabled)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 20
    },
    {
      id: 'bf1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 2 Rod Licence (Senior, Disabled)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        },
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 20
    },
    {
      id: 'c11b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 3 Rod Licence (Junior)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 3,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: '3230c68f-ef65-e611-80dc-c4346bad4004',
          name: 'Junior'
        }
      ],
      cost: 0
    },
    {
      id: 'c31b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 3 Rod Licence (Full)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 3,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [],
      cost: 45
    },
    {
      id: 'c51b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 3 Rod Licence (Senior)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 3,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        }
      ],
      cost: 30
    },
    {
      id: 'c71b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 3 Rod Licence (Junior, Disabled)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 3,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: '3230c68f-ef65-e611-80dc-c4346bad4004',
          name: 'Junior'
        },
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 0
    },
    {
      id: 'c91b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 3 Rod Licence (Full, Disabled)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 3,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 30
    },
    {
      id: 'cb1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 3 Rod Licence (Senior, Disabled)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 3,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        },
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 30
    },
    {
      id: 'd91b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 12 month 1 Rod Licence (Junior)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: '3230c68f-ef65-e611-80dc-c4346bad4004',
          name: 'Junior'
        }
      ],
      cost: 0
    },
    {
      id: 'db1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 12 month 1 Rod Licence (Full)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [],
      cost: 82
    },
    {
      id: 'dd1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 12 month 1 Rod Licence (Senior)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        }
      ],
      cost: 54
    },
    {
      id: 'df1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 12 month 1 Rod Licence (Junior, Disabled)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: '3230c68f-ef65-e611-80dc-c4346bad4004',
          name: 'Junior'
        },
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 0
    },
    {
      id: 'e11b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 12 month 1 Rod Licence (Full, Disabled)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 54
    },
    {
      id: 'e31b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 12 month 1 Rod Licence (Senior, Disabled)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [
        {
          id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Senior'
        },
        {
          id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          name: 'Disabled'
        }
      ],
      cost: 54
    }
  ]
}))

const getSamplePermission = ({
  birthDate,
  juniorConcession = false,
  seniorConcession = false,
  disabledConcession = false,
  licenceLength = '12M'
} = {}) => {
  const concessions = []
  if (juniorConcession) {
    concessions.push({
      type: 'Junior',
      proof: {
        type: 'No Proof'
      }
    })
  } else if (seniorConcession) {
    concessions.push({
      type: 'Senior',
      proof: {
        type: 'No Proof'
      }
    })
  }
  if (disabledConcession) {
    concessions.push({
      type: 'Disabled',
      proof: {
        type: 'National Insurance Number',
        referenceNumber: 'NH 34 67 44 A'
      }
    })
  }

  return {
    licensee: {
      birthDate
    },
    licenceLength,
    ...(licenceLength !== '12M' ? { licenceStartTime: '0' } : {}),
    concessions,
    licenceToStart: 'after-payment',
    licenceStartDate: '2023-01-09',
    licenceType: 'Trout and coarse',
    numberOfRods: '2'
  }
}

const getJuniorPermission = ({ disabledConcession = false } = {}) => {
  return getSamplePermission({
    birthDate: '2010-01-09',
    juniorConcession: true,
    disabledConcession
  })
}

const getAdultPermission = ({ disabledConcession = false, licenceLength } = {}) => {
  return getSamplePermission({
    birthDate: '2006-01-09',
    disabledConcession,
    licenceLength
  })
}

const getSeniorPermission = ({ disabledConcession = false, licenceLength } = {}) => {
  return getSamplePermission({
    birthDate: '1958-01-09',
    disabledConcession,
    seniorConcession: true,
    licenceLength
  })
}

describe('The pricing summary calculator', () => {
  describe('for a junior licence', () => {
    it('returns the correct type pricing data', async () => {
      const samplePermission = getJuniorPermission()
      const { byType } = await pricingDetail('licence-type', samplePermission)
      expect(byType).toMatchSnapshot()
    })

    it('returns the correct type pricing data with a disabled concession', async () => {
      const samplePermission = getJuniorPermission({ disabledConcession: true })
      const { byType } = await pricingDetail('licence-type', samplePermission)
      expect(byType).toMatchSnapshot()
    })

    it('returns the correct length pricing data for a 12 month', async () => {
      const samplePermission = getJuniorPermission()
      const { byLength } = await pricingDetail('licence-length', samplePermission)
      expect(byLength).toMatchSnapshot()
    })
  })

  describe('for an adult licence', () => {
    it('returns the correct type pricing data with a disabled concession', async () => {
      const samplePermission = getAdultPermission({ disabledConcession: true })
      const { byType } = await pricingDetail('licence-type', samplePermission)
      expect(byType).toMatchSnapshot()
    })

    it('returns the correct type pricing data', async () => {
      const samplePermission = {
        licensee: {
          birthDate: '2006-01-09'
        },
        licenceToStart: 'after-payment',
        licenceStartDate: '2023-01-09',
        concessions: [],
        licenceLength: '12M',
        licenceStartTime: '0',
        licenceType: 'Trout and coarse',
        numberOfRods: '2'
      }
      const { byType } = await pricingDetail('licence-type', samplePermission)
      expect(byType).toMatchSnapshot()
    })

    it('returns the correct length pricing data', async () => {
      const samplePermission = getAdultPermission()
      const { byLength } = await pricingDetail('licence-length', samplePermission)
      expect(byLength).toMatchSnapshot()
    })

    it('returns the correct length pricing data for a disabled concession', async () => {
      const samplePermission = getAdultPermission({ disabledConcession: true })
      const { byLength } = await pricingDetail('licence-length', samplePermission)
      expect(byLength).toMatchSnapshot()
    })
  })

  describe('for an senior licence', () => {
    it('returns the correct type pricing data', async () => {
      const samplePermission = getSeniorPermission()
      const { byType } = await pricingDetail('licence-type', samplePermission)
      expect(byType).toMatchSnapshot()
    })

    it('returns the correct type pricing data with a disabled concession', async () => {
      const samplePermission = getSeniorPermission({ disabledConcession: true })
      const { byType } = await pricingDetail('licence-type', samplePermission)
      expect(byType).toMatchSnapshot()
    })

    it('returns the correct length pricing data', async () => {
      const samplePermission = getSeniorPermission()
      const { byLength } = await pricingDetail('licence-length', samplePermission)
      expect(byLength).toMatchSnapshot()
    })

    it('returns the correct length pricing data for a disabled concession', async () => {
      const samplePermission = getSeniorPermission({ disabledConcession: true })
      const { byLength } = await pricingDetail('licence-length', samplePermission)
      expect(byLength).toMatchSnapshot()
    })
  })
})
