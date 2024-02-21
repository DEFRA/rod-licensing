import { pricingDetail, isDateTimeInRangeAndNotJunior } from '../pricing-summary.js'
import moment from 'moment'

jest.mock('../find-permit.js', () => ({
  getPermitsJoinPermitConcessions: () => [
    {
      id: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 1 day 2 Rod Licence (Full)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 1,
      concessions: [],
      cost: 6,
      newCost: 8.6,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 6,
      newCost: 8,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
    },
    {
      id: 'a51b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 1 day 1 Rod Licence (Full)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 1,
      concessions: [],
      cost: 12,
      newCost: 14,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 12,
      newCost: 14,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
    },
    {
      id: 'a91b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 8 day 2 Rod Licence (Full)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 8,
      concessions: [],
      cost: 12,
      newCost: 14,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 12,
      newCost: 14,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
    },
    {
      id: 'b11b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 8 day 1 Rod Licence (Full) ',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400000, label: 'Day(s)', description: 'D' },
      durationMagnitude: 8,
      concessions: [],
      cost: 27,
      newCost: 30,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 27,
      newCost: 30,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 0,
      newCost: 0,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
    },
    {
      id: 'b71b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 2 Rod Licence (Full)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 2,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [],
      cost: 30,
      newCost: 32,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 20,
      newCost: 22.99,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 0,
      newCost: 0,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 20,
      newCost: 22,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 20,
      newCost: 22,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 0,
      newCost: 0,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
    },
    {
      id: 'c31b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Coarse 12 month 3 Rod Licence (Full)',
      permitSubtype: { id: 910400001, label: 'Trout and coarse', description: 'C' },
      numberOfRods: 3,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [],
      cost: 45,
      newCost: 50.4,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 30,
      newCost: 32,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 0,
      newCost: 0,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 30,
      newCost: 32,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 30,
      newCost: 32,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 0,
      newCost: 0,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
    },
    {
      id: 'db1b34a0-0c66-e611-80dc-c4346bad0190',
      description: 'Salmon 12 month 1 Rod Licence (Full)',
      permitSubtype: { id: 910400000, label: 'Salmon and sea trout', description: 'S' },
      numberOfRods: 1,
      durationDesignator: { id: 910400001, label: 'Month(s)', description: 'M' },
      durationMagnitude: 12,
      concessions: [],
      cost: 82,
      newCost: 85,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 54,
      newCost: 60,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 54,
      newCost: 60,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
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
      cost: 54,
      newCost: 60,
      newCostStartDate: '2023-04-01T00:00:00+01:00'
    }
  ]
}))

const getSamplePermission = ({
  birthDate,
  juniorConcession = false,
  seniorConcession = false,
  disabledConcession = false,
  licenceLength = '12M',
  licenceStartDate = '2023-01-09'
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
    licenceStartDate,
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

const getAdultPermission = ({ disabledConcession = false, licenceLength, licenceStartDate } = {}) => {
  return getSamplePermission({
    birthDate: '2006-01-09',
    disabledConcession,
    licenceLength,
    licenceStartDate
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
    it.each`
      permission                                                                           | key         | description
      ${getJuniorPermission()}                                                             | ${'Type'}   | ${'type pricing data'}
      ${getJuniorPermission()}                                                             | ${'Length'} | ${'length pricing data for a 12 month'}
      ${getJuniorPermission({ disabledConcession: true })}                                 | ${'Type'}   | ${'type pricing data with a disabled concession'}
      ${getJuniorPermission({ disabledConcession: true })}                                 | ${'Length'} | ${'length pricing data with a disabled concession'}
      ${getJuniorPermission({ licenceStartDate: '2023-04-01' })}                           | ${'Type'}   | ${'type pricing data when a permission starts after the new price changover'}
      ${getJuniorPermission({ licenceStartDate: '2023-04-01' })}                           | ${'Length'} | ${'length pricing data for a 12 month when a permission starts after the new price changover'}
      ${getJuniorPermission({ disabledConcession: true, licenceStartDate: '2023-04-01' })} | ${'Type'}   | ${'type pricing data with a disabled concession when a permission starts after the new price changover'}
      ${getJuniorPermission({ disabledConcession: true, licenceStartDate: '2023-04-01' })} | ${'Length'} | ${'length pricing data with a disabled concession when a permission starts after the new price changover'}
    `('returns the correct $description', async ({ permission, key }) => {
      const price = await pricingDetail(`licence-${key.toLowerCase()}`, permission)
      expect(price[`by${key}`]).toMatchSnapshot()
    })
  })

  describe('for an adult licence', () => {
    it.each`
      permission                                                                          | key         | description
      ${getAdultPermission()}                                                             | ${'Type'}   | ${'type pricing data'}
      ${getAdultPermission()}                                                             | ${'Length'} | ${'length pricing data'}
      ${getAdultPermission({ disabledConcession: true })}                                 | ${'Type'}   | ${'type pricing data with a disabled concession'}
      ${getAdultPermission({ disabledConcession: true })}                                 | ${'Length'} | ${'length pricing data for a disabled concession'}
      ${getAdultPermission({ licenceStartDate: '2023-04-01' })}                           | ${'Type'}   | ${'pricing data when a permission starts after the new price changover'}
      ${getAdultPermission({ licenceStartDate: '2023-04-01' })}                           | ${'Length'} | ${'length pricing data when a permission starts after the new price changover'}
      ${getAdultPermission({ disabledConcession: true, licenceStartDate: '2023-04-01' })} | ${'Type'}   | ${'pricing data for a disabled concession when a permission starts after the new price changover'}
      ${getAdultPermission({ disabledConcession: true, licenceStartDate: '2023-04-01' })} | ${'Length'} | ${'length pricing data for a disabled concession when a permission starts after the new price changover'}
    `('returns the correct $description', async ({ permission, key }) => {
      const price = await pricingDetail(`licence-${key.toLowerCase()}`, permission)
      expect(price[`by${key}`]).toMatchSnapshot()
    })
  })

  describe('for an senior licence', () => {
    it.each`
      permission                                                                           | key         | description
      ${getSeniorPermission()}                                                             | ${'Type'}   | ${'type pricing data'}
      ${getSeniorPermission()}                                                             | ${'Length'} | ${'length pricing data'}
      ${getSeniorPermission({ disabledConcession: true })}                                 | ${'Type'}   | ${'type pricing data with a disabled concession'}
      ${getSeniorPermission({ disabledConcession: true })}                                 | ${'Length'} | ${'length pricing data for a disabled concession'}
      ${getSeniorPermission({ licenceStartDate: '2023-04-01' })}                           | ${'Type'}   | ${'type pricing data when a permission starts after the new price changover'}
      ${getSeniorPermission({ licenceStartDate: '2023-04-01' })}                           | ${'Length'} | ${'length pricing data when a permission starts after the new price changover'}
      ${getSeniorPermission({ disabledConcession: true, licenceStartDate: '2023-04-01' })} | ${'Type'}   | ${'type pricing data with a disabled concession when a permission starts after the new price changover'}
      ${getSeniorPermission({ disabledConcession: true, licenceStartDate: '2023-04-01' })} | ${'Length'} | ${'length pricing data for a disabled concession when a permission starts after the new price changover'}
    `('returns the correct $description', async ({ permission, key }) => {
      const price = await pricingDetail(`licence-${key.toLowerCase()}`, permission)
      expect(price[`by${key}`]).toMatchSnapshot()
    })
  })

  describe('isDateTimeInRange', () => {
    it.each`
      date                             | concessions     | expected | description                                                   
      ${new Date('2024-03-25T23:59Z')} | ${[]}           | ${false} | ${'before start range date adult'}
      ${new Date('2024-04-01T07:00Z')} | ${[]}           | ${false} | ${'after end range date adult'}
      ${new Date('2024-03-30T23:58Z')} | ${[]}           | ${false} | ${'same date but before start range time adult'}
      ${new Date('2024-04-01T00:04Z')} | ${[]}           | ${false} | ${'same date but after end range time adult'}
      ${new Date('2024-03-30T23:59Z')} | ${[]}           | ${true}  | ${'same date and time of start range adult'}
      ${new Date('2024-04-01T00:00Z')} | ${[]}           | ${true}  | ${'in middle of start and end range adult'}
      ${new Date('2024-04-01T00:01Z')} | ${[]}           | ${true}  | ${'same date and time of end range adult'}
      ${new Date('2024-03-30T23:59Z')} | ${['Junior']}   | ${false} | ${'same date and time of start range junior'}
      ${new Date('2024-04-01T00:00Z')} | ${['Junior']}   | ${false} | ${'in middle of start and end range junior'}
      ${new Date('2024-04-01T00:01Z')} | ${['Junior']}   | ${false} | ${'same date and time of end range junior'}
      ${new Date('2024-03-30T23:59Z')} | ${['Senior']}   | ${true}  | ${'same date and time of start range senior'}
      ${new Date('2024-04-01T00:00Z')} | ${['Senior']}   | ${true}  | ${'in middle of start and end range senior'}
      ${new Date('2024-04-01T00:01Z')} | ${['Senior']}   | ${true}  | ${'same date and time of end range senior'}
      ${new Date('2024-03-30T23:59Z')} | ${['Disabled']} | ${true}  | ${'same date and time of start range disabled'}
      ${new Date('2024-04-01T00:00Z')} | ${['Disabled']} | ${true}  | ${'in middle of start and end range disabled'}
      ${new Date('2024-04-01T00:01Z')} | ${['Disabled']} | ${true}  | ${'same date and time of end range disabled'}
    `('returns $expected when current date and time is $description ', ({ date, concessions, expected }) => {
      const result = isDateTimeInRangeAndNotJunior(concessions, moment(date))
      expect(result).toBe(expected)
    })
  })
})
