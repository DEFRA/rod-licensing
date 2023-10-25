import { findByDateRange } from '../recurring-payment.queries.js'

describe('findByDateRange', () => {
  it.each([
    [[{ nextDueDate: '2022-11-17' }, { nextDueDate: '2023-10-05' }, { nextDueDate: '2023-11-14' }], []],
    [
      [
        { nextDueDate: '2023-11-15' },
        { nextDueDate: '2023-11-17' },
        { nextDueDate: '2023-11-19' },
        { nextDueDate: '2023-11-21' },
        { nextDueDate: '2023-11-23' },
        { nextDueDate: '2023-11-25' }
      ],
      [
        { nextDueDate: '2023-11-25' },
        { nextDueDate: '2023-11-23' },
        { nextDueDate: '2023-11-21' },
        { nextDueDate: '2023-11-19' },
        { nextDueDate: '2023-11-17' },
        { nextDueDate: '2023-11-15' }
      ]
    ],
    [
      [
        { nextDueDate: '2023-11-15' },
        { nextDueDate: '2023-11-16' },
        { nextDueDate: '2023-11-17' },
        { nextDueDate: '2023-11-18' },
        { nextDueDate: '2023-11-19' },
        { nextDueDate: '2023-11-20' },
        { nextDueDate: '2023-11-21' },
        { nextDueDate: '2023-11-22' },
        { nextDueDate: '2023-11-23' },
        { nextDueDate: '2023-11-24' },
        { nextDueDate: '2023-11-25' },
        { nextDueDate: '2023-11-26' }
      ],
      [
        { nextDueDate: '2023-11-25' },
        { nextDueDate: '2023-11-23' },
        { nextDueDate: '2023-11-21' },
        { nextDueDate: '2023-11-19' },
        { nextDueDate: '2023-11-17' },
        { nextDueDate: '2023-11-15' }
      ]
    ]
  ])('returns expected within date range', async (recurringPayments, expected) => {
    const date = new Date('2023-11-25')
    const result = await findByDateRange(recurringPayments, date)
    expect(result).toEqual(expected)
  })
})
