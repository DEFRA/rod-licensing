import { calculateEndDate } from '../../permissions.service.js'
import { getReferenceDataForEntityAndId } from '../../reference-data.service.js'

jest.mock('../../reference-data.service.js')

describe('calculate end date', () => {
  it('returns correct end date on leap year', async () => {
    getReferenceDataForEntityAndId.mockReturnValueOnce({
      durationMagnitude: 12,
      durationDesignator: {
        description: 'M'
      }
    })
    const endDate = await calculateEndDate({ permitId: 1, startDate: '2024-02-29T00:00:00.000Z' })
    expect(endDate).toBe('2025-02-28T23:59:59.999Z')
  })
})
