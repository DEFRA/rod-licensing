import { concessions } from '@defra-fish/connectors-lib/src/sales-api-connector'
import { licenceTypeDisplay } from '../licence-type-display.js'

describe('licence-type-display', () => {
  beforeEach(jest.clearAllMocks)

  // it.each([
  //   ['Coarse 12 months', '2', 'Coarse 12 months, up to 2 rods'],
  //   ['Salmon 12 months', '2', 'Salmon 12 months, up to 2 rods'],
  //   ['Coarse 12 months', '3', 'Coarse 12 months, up to 3 rods']
  // ])('returns licence type with number of rods', (licenceType, numberOfRods, expected) => {
  //   const request = {
  //     licenceType,
  //     numberOfRods
  //   }
  //   const licenceTypeStr = licenceTypeDisplay(request)
  //   expect(licenceTypeStr).toEqual(expected)
  // })

  // it.each([
  //   ['Junior', 'Coarse 12 months', '2', 'Junior, Coarse 12 months, up to 2 rods'],
  //   ['Junior', 'Salmon 12 months', '2', 'Junior, Salmon 12 months, up to 2 rods'],
  //   ['Junior', 'Coarse 12 months', '3', 'Junior, Coarse 12 months, up to 3 rods']
  // ])('returns licence type with number of rods and junior concession if licence for junior', (concession, licenceType, numberOfRods, expected) => {
  //   const request = {
  //     concessions: {
  //       concession,
  //       find: mockFindJunior
  //     },
  //     licenceType,
  //     numberOfRods
  //   }
  //   const licenceTypeStr = licenceTypeDisplay(request)
  //   expect(licenceTypeStr).toEqual(expected)
  // })

  it.each([
    ['Senior', 'Coarse 12 months', '2', 'Over 65, Coarse 12 months, up to 2 rods'],
    ['Senior', 'Salmon 12 months', '2', 'Over 65, Salmon 12 months, up to 2 rods'],
    ['Senior', 'Coarse 12 months', '3', 'Over 65, Coarse 12 months, up to 3 rods']
  ])('returns licence type with number of rods and Over 65 concession if licence for Over 65', (concession, licenceType, numberOfRods, expected) => {
    const request = {
      concessions: {
        concession,
        find: jest.fn()
      },
      licenceType,
      numberOfRods
    }
    const licenceTypeStr = licenceTypeDisplay(request)
    console.log(licenceTypeStr)
    expect(licenceTypeStr).toEqual(expected)
  })
})
