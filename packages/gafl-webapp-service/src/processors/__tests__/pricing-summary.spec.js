import { pricingDetail, shouldDisplayPriceChangePaymentWarningMessage } from '../pricing-summary.js'
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

  describe('shouldDisplayPriceChangePaymentWarningMessage', () => {
    it.each`
      permission               | currentDateTime                    | length   | expected               | licence                      | dateTime
      ${getAdultPermission()}  | ${moment.utc('2025-03-25T23:59Z')} | ${'12M'} | ${undefined}           | ${'12 month adult licence'}  | ${'before start date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-02T00:01Z')} | ${'12M'} | ${undefined}           | ${'12 month adult licence'}  | ${'after end date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-01T00:01Z')} | ${'12M'} | ${'payment-edge-case'} | ${'12 month adult licence'}  | ${'within range'}
      ${getJuniorPermission()} | ${moment.utc('2025-04-01T00:01Z')} | ${'12M'} | ${undefined}           | ${'12 month junior licence'} | ${'within range'}
      ${getAdultPermission()}  | ${moment.utc('2025-03-25T23:59Z')} | ${'8D'}  | ${undefined}           | ${'8 day adult licence'}     | ${'before start date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-02T00:01Z')} | ${'8D'}  | ${undefined}           | ${'8 day adult licence'}     | ${'after end date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-01T00:01Z')} | ${'8D'}  | ${'payment-edge-case'} | ${'8 day adult licence'}     | ${'within range'}
      ${getJuniorPermission()} | ${moment.utc('2025-04-01T00:01Z')} | ${'8D'}  | ${undefined}           | ${'8 day junior licence'}    | ${'within range'}
      ${getAdultPermission()}  | ${moment.utc('2025-03-25T23:59Z')} | ${'1D'}  | ${undefined}           | ${'1 day adult licence'}     | ${'before start date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-02T00:01Z')} | ${'1D'}  | ${undefined}           | ${'1 day adult licence'}     | ${'after end date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-01T00:01Z')} | ${'1D'}  | ${'payment-edge-case'} | ${'1 day adult licence'}     | ${'within range'}
      ${getJuniorPermission()} | ${moment.utc('2025-04-01T00:01Z')} | ${'1D'}  | ${undefined}           | ${'1 day junior licence'}    | ${'within range'}
    `(
      'returns $expected for payment_msg for $licence when current date and time is $dateTime for displaying price change payment warning message',
      async ({ permission, currentDateTime, expected }) => {
        moment.now = () => currentDateTime
        const price = await pricingDetail('licence-length', permission)
        const paymentMsg = price.byLength['12M'].payment_msg
        expect(paymentMsg).toEqual(expected)
      }
    )

    it.each`
      permission               | currentDateTime                    | type                        | expected               | licence                    | dateTime
      ${getAdultPermission()}  | ${moment.utc('2025-03-25T23:59Z')} | ${'salmon-and-sea-trout'}   | ${undefined}           | ${'adult salmon licence'}  | ${'before start date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-02T00:01Z')} | ${'salmon-and-sea-trout'}   | ${undefined}           | ${'adult salmon licence'}  | ${'after end date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-01T00:01Z')} | ${'salmon-and-sea-trout'}   | ${'payment-edge-case'} | ${'adult salmon licence'}  | ${'within range'}
      ${getJuniorPermission()} | ${moment.utc('2025-04-01T00:01Z')} | ${'salmon-and-sea-trout'}   | ${undefined}           | ${'junior salmon licence'} | ${'within range'}
      ${getAdultPermission()}  | ${moment.utc('2025-03-25T23:59Z')} | ${'trout-and-coarse-2-rod'} | ${undefined}           | ${'adult 2 rod licence'}   | ${'before start date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-02T00:01Z')} | ${'trout-and-coarse-2-rod'} | ${undefined}           | ${'adult 2 rod licence'}   | ${'after end date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-01T00:01Z')} | ${'trout-and-coarse-2-rod'} | ${'payment-edge-case'} | ${'adult 2 rod licence'}   | ${'within range'}
      ${getJuniorPermission()} | ${moment.utc('2025-04-01T00:01Z')} | ${'trout-and-coarse-2-rod'} | ${undefined}           | ${'junior 2 rod licence'}  | ${'within range'}
      ${getAdultPermission()}  | ${moment.utc('2025-03-25T23:59Z')} | ${'trout-and-coarse-3-rod'} | ${undefined}           | ${'adult 3 rod licence'}   | ${'before start date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-02T00:01Z')} | ${'trout-and-coarse-3-rod'} | ${undefined}           | ${'adult 3 rod licence'}   | ${'after end date'}
      ${getAdultPermission()}  | ${moment.utc('2025-04-01T00:01Z')} | ${'trout-and-coarse-3-rod'} | ${'payment-edge-case'} | ${'adult 3 rod licence'}   | ${'within range'}
      ${getJuniorPermission()} | ${moment.utc('2025-04-01T00:01Z')} | ${'trout-and-coarse-3-rod'} | ${undefined}           | ${'junior 3 rod licence'}  | ${'within range'}
    `(
      'returns $expected for payment_msg for $licence when current date and time is $dateTime for displaying price change payment warning message',
      async ({ permission, currentDateTime, type, expected }) => {
        moment.now = () => currentDateTime
        const price = await pricingDetail('licence-type', permission)
        const paymentMsg = price.byType[type].payment_msg
        expect(paymentMsg).toEqual(expected)
      }
    )

    it.each`
      date                             | concessions     | expected | dateTime                       | licence
      ${new Date('2025-03-25T23:59Z')} | ${[]}           | ${false} | ${'before start date'}         | ${'an adult licence'}
      ${new Date('2025-04-04T01:00Z')} | ${[]}           | ${false} | ${'after start date'}          | ${'an adult licence'}
      ${new Date('2025-03-30T23:58Z')} | ${[]}           | ${false} | ${'same date but before time'} | ${'an adult licence'}
      ${new Date('2025-04-01T00:04Z')} | ${[]}           | ${false} | ${'same date but after time'}  | ${'an adult licence'}
      ${new Date('2025-03-30T23:59Z')} | ${[]}           | ${true}  | ${'start of range'}            | ${'an adult licence'}
      ${new Date('2025-04-01T00:00Z')} | ${[]}           | ${true}  | ${'within range'}              | ${'an adult licence'}
      ${new Date('2025-04-01T00:01Z')} | ${[]}           | ${true}  | ${'end of range'}              | ${'an adult licence'}
      ${new Date('2025-03-30T23:59Z')} | ${['Junior']}   | ${false} | ${'start of range'}            | ${'a junior licence'}
      ${new Date('2025-04-01T00:00Z')} | ${['Junior']}   | ${false} | ${'within range'}              | ${'a junior licence'}
      ${new Date('2025-04-01T00:01Z')} | ${['Junior']}   | ${false} | ${'end of range'}              | ${'a junior licence'}
      ${new Date('2025-03-30T23:59Z')} | ${['Senior']}   | ${true}  | ${'start of range'}            | ${'a senior licence'}
      ${new Date('2025-04-01T00:00Z')} | ${['Senior']}   | ${true}  | ${'within range'}              | ${'a senior licence'}
      ${new Date('2025-04-01T00:01Z')} | ${['Senior']}   | ${true}  | ${'end of range'}              | ${'a senior licence'}
      ${new Date('2025-03-30T23:59Z')} | ${['Disabled']} | ${true}  | ${'start of range'}            | ${'a disabled licence'}
      ${new Date('2025-04-01T00:00Z')} | ${['Disabled']} | ${true}  | ${'within range'}              | ${'a disabled licence'}
      ${new Date('2025-04-01T00:01Z')} | ${['Disabled']} | ${true}  | ${'end of range'}              | ${'a disabled licence'}
    `('returns $expected when we have $licence and current date and time is $dateTime', ({ date, concessions, expected }) => {
      moment.now = () => moment(date)
      const result = shouldDisplayPriceChangePaymentWarningMessage(concessions)
      expect(result).toBe(expected)
    })
  })
})
