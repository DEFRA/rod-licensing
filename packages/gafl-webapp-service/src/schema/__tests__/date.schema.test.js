import Joi from 'joi'
import { dateSchemaInput, dateSchema } from '../date.schema.js'

describe('dateSchemaInput', () => {
  it('matches expected format', () => {
    expect(dateSchemaInput('1', '2', '2023')).toMatchSnapshot()
  })
})

describe('dateSchema', () => {
  const getSamplePayload = ({ day = '', month = '', year = '' } = {}) => ({
    'date-of-birth-day': day,
    'date-of-birth-month': month,
    'date-of-birth-year': year
  })

  it.each`
    payload                                                     | expectedError          | payloadDesc
    ${{}}                                                       | ${'full-date'}         | ${'empty day, month and year'}
    ${{ year: '1' }}                                            | ${'day-and-month'}     | ${'empty day and month'}
    ${{ month: '2' }}                                           | ${'day-and-year'}      | ${'empty day and year'}
    ${{ day: '3' }}                                             | ${'month-and-year'}    | ${'empty month and year'}
    ${{ month: '5', year: '2023' }}                             | ${'day'}               | ${'empty day'}
    ${{ day: '12', year: '2024' }}                              | ${'month'}             | ${'empty month'}
    ${{ day: '15', month: '3' }}                                | ${'year'}              | ${'empty year'}
    ${{ day: 'Ides', month: 'March', year: '44 B.C.' }}         | ${'non-numeric.day'}   | ${'non-numerics entered'}
    ${{ day: 'Thirteenth', month: '11', year: '1978' }}         | ${'non-numeric.day'}   | ${'non-numeric day'}
    ${{ day: '29', month: 'MAR', year: '2002' }}                | ${'non-numeric.month'} | ${'non-numeric month '}
    ${{ day: '13', month: '1', year: 'Two thousand and five' }} | ${'non-numeric.year'}  | ${'non-numeric year'}
    ${{ day: '30', month: '2', year: '1994' }}                  | ${'invalid-date'}      | ${'an invalid date - 1994-02-40'}
    ${{ day: '1', month: '13', year: '2022' }}                  | ${'invalid-date'}      | ${'an invalid date - 2022-13-01'}
    ${{ day: '29', month: '2', year: '2023' }}                  | ${'invalid-date'}      | ${'an invalid date - 1994-02-40'}
  `('Error has $expectedError in details when payload has $payloadDesc', ({ payload: { day, month, year }, expectedError }) => {
    expect(() => {
      Joi.assert(dateSchemaInput(day, month, year), dateSchema)
    }).toThrow(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({
            path: expectedError.split('.'),
            context: expect.objectContaining({
              label: expectedError,
              key: expectedError.split('.').pop()
            })
          })
        ])
      })
    )
  })

  it('valid date passes validation', () => {
    expect(() => {
      Joi.assert(dateSchemaInput('12', '10', '1987'), dateSchema)
    }).not.toThrow()
  })
})
