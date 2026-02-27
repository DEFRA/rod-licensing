import als from '../address-lookup-service.js'
import fetch from 'node-fetch'

jest.mock('node-fetch')

describe('address-lookup-service', () => {
  beforeAll(() => {
    process.env.ADDRESS_LOOKUP_KEY = 'ADDRESS_LOOKUP_KEY'
    process.env.ADDRESS_LOOKUP_URL = 'https://address.lookup.url'
  })
  beforeEach(jest.clearAllMocks)

  describe('default', () => {
    it('returns empty array if results node is missing', async () => {
      fetch.mockResolvedValue({ json: () => Promise.resolve({}) })
      const results = await als()
      expect(results).toEqual([])
    })

    it.each([
      [
        '1 HOWECROFT COURT, EASTMEAD LANE, BRISTOL, BS9 1HJ',
        'BS9 1HJ',
        '1 HOWECROFT COURT',
        'EASTMEAD LANE',
        '',
        'BRISTOL',
        'This record is within England'
      ],
      [
        '9 ORBIT STREET, ADAMSDOWN, CARDIfF, CF24 0JX',
        'CF24 0JX',
        '9 ORBIT STREET',
        null,
        'ADAMSDOWN',
        'CARDIFF',
        'This record is within Wales'
      ],
      [
        '45 TINTERN CLOSE, EASTBOURNE, BN22 0UF',
        'BN22 0UF',
        '45 TINTERN CLOSE',
        null,
        null,
        'EASTBOURNE',
        'This record is within England'
      ]
    ])(
      'if data is returned from the API, it maps the data correctly in lower case, other than postcode',
      async (address, postcode, buildingName, thoroughfare, locality, town, country) => {
        fetch.mockResolvedValue({
          json: () => ({
            results: [
              {
                DPA: {
                  ADDRESS: address,
                  POSTCODE: postcode,
                  BUILDING_NAME: buildingName,
                  THOROUGHFARE_NAME: thoroughfare,
                  DEPENDENT_LOCALITY: locality,
                  POST_TOWN: town,
                  COUNTRY_CODE_DESCRIPTION: country
                }
              }
            ]
          })
        })
        const results = await als()
        expect(results[0]).toEqual({
          id: 0,
          address: `${address.replace(postcode, '').toLowerCase()}${postcode}`,
          premises: buildingName || '',
          street: thoroughfare || '',
          locality: locality || '',
          town: town || '',
          postcode: postcode,
          country: country || ''
        })
      }
    )
  })

  describe('filtering by premises', () => {
    it('filters results by BUILDING_NAME substring match', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '1 SARK TOWER, EREBUS DRIVE, LONDON, SE28 0GG',
                POSTCODE: 'SE28 0GG',
                BUILDING_NAME: '1 SARK TOWER',
                THOROUGHFARE_NAME: 'EREBUS DRIVE',
                POST_TOWN: 'LONDON',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            },
            {
              DPA: {
                ADDRESS: '10 SARK TOWER, EREBUS DRIVE, LONDON, SE28 0GG',
                POSTCODE: 'SE28 0GG',
                BUILDING_NAME: '10 SARK TOWER',
                THOROUGHFARE_NAME: 'EREBUS DRIVE',
                POST_TOWN: 'LONDON',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('10 sark', 'SE28 0GG')

      expect(results).toEqual([
        {
          id: 0,
          address: '10 sark tower, erebus drive, london, SE28 0GG',
          premises: '10 SARK TOWER',
          street: 'EREBUS DRIVE',
          locality: '',
          town: 'LONDON',
          postcode: 'SE28 0GG',
          country: 'This record is within England'
        }
      ])
    })

    it('filters results by SUB_BUILDING_NAME for flats', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: 'FLAT 1-1 LOWRY 1, PEEL PARK QUARTER, UNIVERSITY ROAD, SALFORD, M5 4NJ',
                POSTCODE: 'M5 4NJ',
                SUB_BUILDING_NAME: 'FLAT 1-1 LOWRY 1',
                BUILDING_NAME: 'PEEL PARK QUARTER',
                THOROUGHFARE_NAME: 'UNIVERSITY ROAD',
                POST_TOWN: 'SALFORD',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            },
            {
              DPA: {
                ADDRESS: 'FLAT 1-2 LOWRY 1, PEEL PARK QUARTER, UNIVERSITY ROAD, SALFORD, M5 4NJ',
                POSTCODE: 'M5 4NJ',
                SUB_BUILDING_NAME: 'FLAT 1-2 LOWRY 1',
                BUILDING_NAME: 'PEEL PARK QUARTER',
                THOROUGHFARE_NAME: 'UNIVERSITY ROAD',
                POST_TOWN: 'SALFORD',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('1-1', 'M5 4NJ')

      expect(results).toEqual([
        {
          id: 0,
          address: 'flat 1-1 lowry 1, peel park quarter, university road, salford, M5 4NJ',
          premises: 'PEEL PARK QUARTER',
          street: 'UNIVERSITY ROAD',
          locality: '',
          town: 'SALFORD',
          postcode: 'M5 4NJ',
          country: 'This record is within England'
        }
      ])
    })

    it('filters results by BUILDING_NUMBER', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '14, CHURCH STREET, YORK, YO1 8BE',
                POSTCODE: 'YO1 8BE',
                BUILDING_NUMBER: '14',
                THOROUGHFARE_NAME: 'CHURCH STREET',
                POST_TOWN: 'YORK',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            },
            {
              DPA: {
                ADDRESS: '15, CHURCH STREET, YORK, YO1 8BE',
                POSTCODE: 'YO1 8BE',
                BUILDING_NUMBER: '15',
                THOROUGHFARE_NAME: 'CHURCH STREET',
                POST_TOWN: 'YORK',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('14', 'YO1 8BE')

      expect(results).toEqual([
        {
          id: 0,
          address: '14, church street, york, YO1 8BE',
          premises: '',
          street: 'CHURCH STREET',
          locality: '',
          town: 'YORK',
          postcode: 'YO1 8BE',
          country: 'This record is within England'
        }
      ])
    })

    it('filters results by ORGANISATION_NAME', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: 'THE BARN, ROSE FARM, YORK, YO60 7PD',
                POSTCODE: 'YO60 7PD',
                BUILDING_NAME: 'THE BARN',
                ORGANISATION_NAME: 'ROSE FARM',
                POST_TOWN: 'YORK',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            },
            {
              DPA: {
                ADDRESS: 'STABLE COTTAGE, BLUE MEADOW, YORK, YO60 7PD',
                POSTCODE: 'YO60 7PD',
                BUILDING_NAME: 'STABLE COTTAGE',
                ORGANISATION_NAME: 'BLUE MEADOW',
                POST_TOWN: 'YORK',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('rose farm', 'YO60 7PD')

      expect(results).toEqual([
        {
          id: 0,
          address: 'the barn, rose farm, york, YO60 7PD',
          premises: 'THE BARN',
          street: '',
          locality: '',
          town: 'YORK',
          postcode: 'YO60 7PD',
          country: 'This record is within England'
        }
      ])
    })

    it('performs case-insensitive filtering', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: 'THE BARN, YORK, YO60 7PD',
                POSTCODE: 'YO60 7PD',
                BUILDING_NAME: 'THE BARN',
                POST_TOWN: 'YORK',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('the barn', 'YO60 7PD')

      expect(results[0].premises).toBe('THE BARN')
    })

    it('trims whitespace from premises search term', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '10 SARK TOWER, LONDON, SE28 0GG',
                POSTCODE: 'SE28 0GG',
                BUILDING_NAME: '10 SARK TOWER',
                POST_TOWN: 'LONDON',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('  10 sark  ', 'SE28 0GG')

      expect(results[0].premises).toBe('10 SARK TOWER')
    })

    it.each([
      ['null', null],
      ['empty string', '']
    ])('returns all results when premises is %s', async (_, premisesValue) => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '1 SARK TOWER, LONDON, SE28 0GG',
                POSTCODE: 'SE28 0GG',
                BUILDING_NAME: '1 SARK TOWER',
                POST_TOWN: 'LONDON',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            },
            {
              DPA: {
                ADDRESS: '10 SARK TOWER, LONDON, SE28 0GG',
                POSTCODE: 'SE28 0GG',
                BUILDING_NAME: '10 SARK TOWER',
                POST_TOWN: 'LONDON',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als(premisesValue, 'SE28 0GG')

      expect(results.length).toBe(2)
    })

    it('returns empty array when filter matches nothing', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '1 SARK TOWER, LONDON, SE28 0GG',
                POSTCODE: 'SE28 0GG',
                BUILDING_NAME: '1 SARK TOWER',
                POST_TOWN: 'LONDON',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('nonexistent address', 'SE28 0GG')

      expect(results).toEqual([])
    })

    it('returns only matching results from multiple addresses', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '1 ROSE FARM COTTAGES, YORK, YO60 7PD',
                POSTCODE: 'YO60 7PD',
                BUILDING_NAME: '1 ROSE FARM COTTAGES',
                POST_TOWN: 'YORK',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            },
            {
              DPA: {
                ADDRESS: '1 SOUTH VIEW, YORK, YO60 7PD',
                POSTCODE: 'YO60 7PD',
                BUILDING_NAME: '1 SOUTH VIEW',
                POST_TOWN: 'YORK',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            },
            {
              DPA: {
                ADDRESS: '2 ROSE FARM COTTAGES, YORK, YO60 7PD',
                POSTCODE: 'YO60 7PD',
                BUILDING_NAME: '2 ROSE FARM COTTAGES',
                POST_TOWN: 'YORK',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('rose farm', 'YO60 7PD')

      expect(results.length).toBe(2)
    })

    it('normalizes multiple spaces in user input to single space', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: 'THE BARN, MAIN STREET, BRISTOL, BS1 1AA',
                POSTCODE: 'BS1 1AA',
                BUILDING_NAME: 'THE BARN',
                POST_TOWN: 'BRISTOL',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('the  barn', 'BS1 1AA')

      expect(results.length).toBe(1)
    })

    it('normalizes multiple spaces in API results to single space', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: 'THE  BARN, MAIN STREET, BRISTOL, BS1 1AA',
                POSTCODE: 'BS1 1AA',
                BUILDING_NAME: 'THE  BARN',
                POST_TOWN: 'BRISTOL',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('the barn', 'BS1 1AA')

      expect(results.length).toBe(1)
    })

    it('normalizes multiple spaces in both input and API results', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: 'THE   OLD   BARN, MAIN STREET, BRISTOL, BS1 1AA',
                POSTCODE: 'BS1 1AA',
                BUILDING_NAME: 'THE   OLD   BARN',
                POST_TOWN: 'BRISTOL',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await als('the  old  barn', 'BS1 1AA')

      expect(results.length).toBe(1)
    })
  })

  describe('handles missing optional fields', () => {
    it.each([
      ['DEPENDENT_LOCALITY', 'locality', { BUILDING_NAME: '1 MAIN STREET', POST_TOWN: 'BRISTOL', COUNTRY_CODE_DESCRIPTION: 'This record is within England' }],
      ['POST_TOWN', 'town', { BUILDING_NAME: '1 MAIN STREET', COUNTRY_CODE_DESCRIPTION: 'This record is within England' }],
      ['COUNTRY_CODE_DESCRIPTION', 'country', { BUILDING_NAME: '1 MAIN STREET', POST_TOWN: 'BRISTOL' }]
    ])('returns empty string when %s is missing', async (missingField, resultProperty, dpaData) => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '1 MAIN STREET, BRISTOL, BS1 1AA',
                POSTCODE: 'BS1 1AA',
                ...dpaData
              }
            }
          ]
        })
      })

      const results = await als(null, 'BS1 1AA')

      expect(results[0][resultProperty]).toBe('')
    })
  })

  describe('error handling', () => {
    it.each([
      ['Network error', 'Network error'],
      ['HTTP 500 error', '500 Internal Server Error'],
      ['Timeout', 'Timeout']
    ])('returns empty array when %s occurs', async (description, errorMessage) => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      fetch.mockRejectedValueOnce(new Error(errorMessage))

      const results = await als('test', 'BS9 1HJ')

      expect(results).toEqual([])
      consoleErrorSpy.mockRestore()
    })

    it.each([
      ['Network error', 'Network error'],
      ['HTTP 500 error', '500 Internal Server Error'],
      ['Timeout', 'Timeout']
    ])('logs error when %s occurs', async (description, errorMessage) => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const testError = new Error(errorMessage)
      fetch.mockRejectedValueOnce(testError)

      await als('test', 'BS9 1HJ')

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to connect to address lookup service', testError)
      consoleErrorSpy.mockRestore()
    })
  })
})
