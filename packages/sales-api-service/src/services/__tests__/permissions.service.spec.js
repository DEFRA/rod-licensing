import { generatePermissionNumber, calculateEndDate, generate, createRecurringPaymentPermission } from '../permissions.service.js'
import moment from 'moment'
import {
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_12MONTH_DISABLED_PERMIT,
  MOCK_1DAY_FULL_PERMIT_ENTITY,
  MOCK_CONCESSION
} from '../../__mocks__/test-data.js'
import { JUNIOR_MAX_AGE, SENIOR_MIN_AGE } from '@defra-fish/business-rules-lib'
import { persist } from '@defra-fish/dynamics-lib'

jest.mock('@defra-fish/business-rules-lib', () => {
  const brl = jest.requireActual('@defra-fish/business-rules-lib')
  return {
    ...brl,
    isSenior: jest.fn(brl.isSenior)
  }
})

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  persist: jest.fn()
}))

jest.mock('../reference-data.service.js', () => ({
  ...jest.requireActual('../reference-data.service.js'),
  getReferenceDataForEntityAndId: async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_SENIOR_PERMIT.constructor) {
      for (const permit of [
        MOCK_12MONTH_DISABLED_PERMIT,
        MOCK_12MONTH_SENIOR_PERMIT,
        MOCK_1DAY_SENIOR_PERMIT_ENTITY,
        MOCK_1DAY_FULL_PERMIT_ENTITY
      ]) {
        if (permit.id === id) {
          return permit
        }
      }
      return null
    } else if (entityType === MOCK_CONCESSION.constructor) {
      item = MOCK_CONCESSION
    }
    return item
  }
}))

const getSamplePermission = ({
  permitId = MOCK_1DAY_FULL_PERMIT_ENTITY.id,
  birthDate = moment().subtract(SENIOR_MIN_AGE, 'years').format('YYYY-MM-DD')
} = {}) => ({
  permitId,
  issueDate: moment().toISOString(),
  startDate: moment().toISOString(),
  licensee: {
    firstName: 'Fester',
    lastName: 'Tester',
    birthDate
  }
})

describe('permissions service', () => {
  beforeEach(jest.clearAllMocks)

  describe('generatePermissionNumber', () => {
    it('generates a permission number for adults', async () => {
      const number = await generatePermissionNumber(
        getSamplePermission({
          permitId: MOCK_12MONTH_DISABLED_PERMIT.id,
          birthDate: moment().subtract(JUNIOR_MAX_AGE, 'years').format('YYYY-MM-DD')
        }),
        'Telesales'
      )
      const block1 = moment().subtract(1, 'day').add(1, 'year').endOf('day').format('HHDDMMYY')
      const expected = new RegExp(`^${block1}-1TS3FFT-[A-Z0-9]{5}[0-9]$`)
      expect(number).toMatch(expected)
    })

    it('generates a permission number for juniors', async () => {
      const number = await generatePermissionNumber(
        getSamplePermission({
          birthDate: moment()
            .subtract(JUNIOR_MAX_AGE - 1, 'years')
            .format('YYYY-MM-DD')
        }),
        'Web Sales'
      )
      const block1 = moment().add(1, 'hour').startOf('hour').add(1, 'day').format('HHDDMMYY')
      const expected = new RegExp(`^${block1}-2WC1JFT-[A-Z0-9]{5}[0-9]$`)
      expect(number).toMatch(expected)
    })

    it('generates a permission number for seniors', async () => {
      const number = await generatePermissionNumber(getSamplePermission(), 'Web Sales')
      const block1 = moment().add(1, 'hour').startOf('hour').add(1, 'day').format('HHDDMMYY')
      const expected = new RegExp(`^${block1}-2WC1SFT-[A-Z0-9]{5}[0-9]$`)
      expect(number).toMatch(expected)
    })
  })

  describe('calculateEndDate', () => {
    it('calculates 364 days for 1 year licences outside of a leap year', async () => {
      const startDate = moment('2019-01-01')
      const expectedEndDate = moment('2019-12-31').endOf('day')

      const endDate = await calculateEndDate({ permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190', startDate: startDate })
      expect(endDate).toEqual(expectedEndDate.toISOString())
    })

    it('calculates 365 days for 1 year licences in a leap year', async () => {
      const startDate = moment('2020-01-01')
      const expectedEndDate = moment('2020-12-31').endOf('day')

      const endDate = await calculateEndDate({ permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190', startDate: startDate })
      expect(endDate).toEqual(expectedEndDate.toISOString())
    })

    describe('when the licence starts and finishes during BST', () => {
      it('finishes just before midnight in BST', async () => {
        const startDate = moment('2020-06-01')
        const expectedEndDate = moment.utc('2021-05-31').endOf('day').subtract(1, 'hours')

        const endDate = await calculateEndDate({ permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190', startDate: startDate })
        expect(endDate).toEqual(expectedEndDate.toISOString())
      })
    })

    // In 2018, BST starts on 25 March. In 2019, BST starts on 31 March.
    describe('when the licence starts during BST and finishes during GMT', () => {
      it('finishes just before midnight in GMT', async () => {
        const startDate = moment('2018-03-27')
        const expectedEndDate = moment.utc('2019-03-26').endOf('day')

        const endDate = await calculateEndDate({ permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190', startDate: startDate })
        expect(endDate).toEqual(expectedEndDate.toISOString())
      })
    })

    // In 2020, BST ends on 25 October. In 2021, BST ends on 31 October.
    describe('when the licence starts during GMT and finishes during BST', () => {
      it('finishes just before midnight in BST', async () => {
        const startDate = moment('2020-10-26')
        const expectedEndDate = moment.utc('2021-10-25').endOf('day').subtract(1, 'hours')

        const endDate = await calculateEndDate({ permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190', startDate: startDate })
        expect(endDate).toEqual(expectedEndDate.toISOString())
      })
    })

    it('returns correct end date on leap year', async () => {
      const startDate = moment('2024-02-29')
      const endDate = await calculateEndDate({ permitId: 'e11b34a0-0c66-e611-80dc-c4346bad0190', startDate })
      expect(endDate).toBe('2025-02-28T23:59:59.999Z')
    })
  })

  describe('sequence generator', () => {
    it('generates a rolling sequence', () => {
      const results = []
      for (let i = 0; i < 12; i++) {
        results.push(generate(i, ['AB', '123']))
      }
      expect(results).toEqual(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3'])
    })
  })

  describe('createRecurringPaymentPermission', () => {
    it('persist is called with new permission', async () => {
      const mockPermissionData = {
        referenceNumber: '12345',
        issueDate: '2025-02-17T08:55:45.524Z',
        startDate: '2025-02-17T08:55:45.524Z',
        endDate: '2026-02-17T08:55:45.524Z',
        dataSource: 'Web',
        isRenewal: false,
        licensee: { firstName: 'John', lastName: 'Doe', birthDate: '1990-01-01' },
        permitId: 'some-permit-id',
        isLicenceForYou: 'yes'
      }

      await createRecurringPaymentPermission(mockPermissionData)

      const expectedPermission = {
        referenceNumber: mockPermissionData.referenceNumber,
        issueDate: mockPermissionData.issueDate,
        startDate: mockPermissionData.startDate,
        endDate: mockPermissionData.endDate,
        dataSource: mockPermissionData.dataSource,
        isRenewal: mockPermissionData.isRenewal,
        isLicenceForYou: mockPermissionData.isLicenceForYou,
        licensee: mockPermissionData.licensee,
        permitId: mockPermissionData.permitId
      }

      expect(persist).toHaveBeenCalledWith([expect.objectContaining(expectedPermission)])
    })

    it('throws an error if permission data is missing', async () => {
      await expect(createRecurringPaymentPermission(null, 'TestUser')).rejects.toThrow('Missing permission data')
    })

    it('throws an error if licensee is missing', async () => {
      await expect(createRecurringPaymentPermission({ permitId: 'some-permit-id' }, 'TestUser')).rejects.toThrow(
        'Missing permission data'
      )
    })

    it('throws an error if permitId is missing', async () => {
      await expect(
        createRecurringPaymentPermission({ licensee: { firstName: 'John', lastName: 'Doe' } }, 'TestUser')
      ).rejects.toThrow('Missing permission data')
    })
  })
})
