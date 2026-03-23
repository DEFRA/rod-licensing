import addressLookupService from '../address-lookup-service.js'
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
      const results = await addressLookupService()
      expect(results).toEqual([])
    })

    it.each`
      address                                                 | postcode      | buildingName           | thoroughfare       | locality       | town            | country                            | expectedAddress                                         | expectedPremises       | expectedStreet     | expectedLocality | expectedTown
      ${'1 HOWECROFT COURT, EASTMEAD LANE, BRISTOL, BS9 1HJ'} | ${'BS9 1HJ'}  | ${'1 HOWECROFT COURT'} | ${'EASTMEAD LANE'} | ${''}          | ${'BRISTOL'}    | ${'This record is within England'} | ${'1 howecroft court, eastmead lane, bristol, BS9 1HJ'} | ${'1 HOWECROFT COURT'} | ${'EASTMEAD LANE'} | ${''}            | ${'BRISTOL'}
      ${'9 ORBIT STREET, ADAMSDOWN, CARDIfF, CF24 0JX'}       | ${'CF24 0JX'} | ${'9 ORBIT STREET'}    | ${null}            | ${'ADAMSDOWN'} | ${'CARDIFF'}    | ${'This record is within Wales'}   | ${'9 orbit street, adamsdown, cardiff, CF24 0JX'}       | ${'9 ORBIT STREET'}    | ${''}              | ${'ADAMSDOWN'}   | ${'CARDIFF'}
      ${'45 TINTERN CLOSE, EASTBOURNE, BN22 0UF'}             | ${'BN22 0UF'} | ${'45 TINTERN CLOSE'}  | ${null}            | ${null}        | ${'EASTBOURNE'} | ${'This record is within England'} | ${'45 tintern close, eastbourne, BN22 0UF'}             | ${'45 TINTERN CLOSE'}  | ${''}              | ${''}            | ${'EASTBOURNE'}
    `(
      'if data is returned from the API, it maps the data correctly in lower case, other than postcode',
      async ({
        address,
        postcode,
        buildingName,
        thoroughfare,
        locality,
        town,
        country,
        expectedAddress,
        expectedPremises,
        expectedStreet,
        expectedLocality,
        expectedTown
      }) => {
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
        const results = await addressLookupService()
        expect(results[0]).toEqual({
          id: 0,
          address: expectedAddress,
          premises: expectedPremises,
          street: expectedStreet,
          locality: expectedLocality,
          town: expectedTown,
          postcode: postcode
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

      const results = await addressLookupService('10 sark', 'SE28 0GG')

      expect(results).toEqual([
        {
          id: 0,
          address: '10 sark tower, erebus drive, london, SE28 0GG',
          premises: '10 SARK TOWER',
          street: 'EREBUS DRIVE',
          locality: '',
          town: 'LONDON',
          postcode: 'SE28 0GG'
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

      const results = await addressLookupService('1-1', 'M5 4NJ')

      expect(results).toEqual([
        {
          id: 0,
          address: 'flat 1-1 lowry 1, peel park quarter, university road, salford, M5 4NJ',
          premises: 'PEEL PARK QUARTER',
          street: 'UNIVERSITY ROAD',
          locality: '',
          town: 'SALFORD',
          postcode: 'M5 4NJ'
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

      const results = await addressLookupService('14', 'YO1 8BE')

      expect(results).toEqual([
        {
          id: 0,
          address: '14, church street, york, YO1 8BE',
          premises: '',
          street: 'CHURCH STREET',
          locality: '',
          town: 'YORK',
          postcode: 'YO1 8BE'
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

      const results = await addressLookupService('rose farm', 'YO60 7PD')

      expect(results).toEqual([
        {
          id: 0,
          address: 'the barn, rose farm, york, YO60 7PD',
          premises: 'THE BARN',
          street: '',
          locality: '',
          town: 'YORK',
          postcode: 'YO60 7PD'
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

      const results = await addressLookupService('the barn', 'YO60 7PD')

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

      const results = await addressLookupService('  10 sark  ', 'SE28 0GG')

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

      const results = await addressLookupService(premisesValue, 'SE28 0GG')

      expect(results).toEqual([
        {
          id: 0,
          address: '1 sark tower, london, SE28 0GG',
          premises: '1 SARK TOWER',
          street: '',
          locality: '',
          town: 'LONDON',
          postcode: 'SE28 0GG'
        },
        {
          id: 1,
          address: '10 sark tower, london, SE28 0GG',
          premises: '10 SARK TOWER',
          street: '',
          locality: '',
          town: 'LONDON',
          postcode: 'SE28 0GG'
        }
      ])
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

      const results = await addressLookupService('nonexistent address', 'SE28 0GG')

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

      const results = await addressLookupService('rose farm', 'YO60 7PD')

      expect(results).toEqual([
        {
          id: 0,
          address: '1 rose farm cottages, york, YO60 7PD',
          premises: '1 ROSE FARM COTTAGES',
          street: '',
          locality: '',
          town: 'YORK',
          postcode: 'YO60 7PD'
        },
        {
          id: 1,
          address: '2 rose farm cottages, york, YO60 7PD',
          premises: '2 ROSE FARM COTTAGES',
          street: '',
          locality: '',
          town: 'YORK',
          postcode: 'YO60 7PD'
        }
      ])
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

      const results = await addressLookupService('the  barn', 'BS1 1AA')

      expect(results).toEqual([
        {
          id: 0,
          address: 'the barn, main street, bristol, BS1 1AA',
          premises: 'THE BARN',
          street: '',
          locality: '',
          town: 'BRISTOL',
          postcode: 'BS1 1AA'
        }
      ])
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

      const results = await addressLookupService('the barn', 'BS1 1AA')

      expect(results).toEqual([
        {
          id: 0,
          address: 'the  barn, main street, bristol, BS1 1AA',
          premises: 'THE  BARN',
          street: '',
          locality: '',
          town: 'BRISTOL',
          postcode: 'BS1 1AA'
        }
      ])
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

      const results = await addressLookupService('the  old  barn', 'BS1 1AA')

      expect(results).toEqual([
        {
          id: 0,
          address: 'the   old   barn, main street, bristol, BS1 1AA',
          premises: 'THE   OLD   BARN',
          street: '',
          locality: '',
          town: 'BRISTOL',
          postcode: 'BS1 1AA'
        }
      ])
    })

    it('returns empty array when results is null but premises filter provided', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: null
        })
      })

      const results = await addressLookupService('test', 'BS1 1AA')

      expect(results).toEqual([])
    })

    it('returns all results when premises parameter is null', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '1 TEST STREET, BRISTOL, BS1 1AA',
                POSTCODE: 'BS1 1AA',
                BUILDING_NAME: '1 TEST STREET',
                POST_TOWN: 'BRISTOL',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await addressLookupService(null, 'BS1 1AA')

      expect(results).toHaveLength(1)
    })

    it('returns all results when premises parameter is undefined', async () => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            {
              DPA: {
                ADDRESS: '1 TEST STREET, BRISTOL, BS1 1AA',
                POSTCODE: 'BS1 1AA',
                BUILDING_NAME: '1 TEST STREET',
                POST_TOWN: 'BRISTOL',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            },
            {
              DPA: {
                ADDRESS: '2 TEST STREET, BRISTOL, BS1 1AA',
                POSTCODE: 'BS1 1AA',
                BUILDING_NAME: '2 TEST STREET',
                POST_TOWN: 'BRISTOL',
                COUNTRY_CODE_DESCRIPTION: 'This record is within England'
              }
            }
          ]
        })
      })

      const results = await addressLookupService(undefined, 'BS1 1AA')

      expect(results).toHaveLength(2)
    })
  })

  describe('handles missing optional fields', () => {
    it.each([
      [
        'DEPENDENT_LOCALITY',
        'locality',
        { BUILDING_NAME: '1 MAIN STREET', POST_TOWN: 'BRISTOL', COUNTRY_CODE_DESCRIPTION: 'This record is within England' }
      ],
      ['POST_TOWN', 'town', { BUILDING_NAME: '1 MAIN STREET', COUNTRY_CODE_DESCRIPTION: 'This record is within England' }]
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

      const results = await addressLookupService(null, 'BS1 1AA')

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

      const results = await addressLookupService('test', 'BS9 1HJ')

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

      await addressLookupService('test', 'BS9 1HJ')

      expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to connect to address lookup service', testError)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('pagination', () => {
    const createMockAddress = idx => ({
      DPA: {
        ADDRESS: `${idx} TEST STREET, BRISTOL, BS1 1AA`,
        POSTCODE: 'BS1 1AA',
        BUILDING_NAME: `${idx} TEST STREET`,
        THOROUGHFARE_NAME: 'TEST STREET',
        POST_TOWN: 'BRISTOL'
      }
    })

    const createMockResponse = (totalresults, maxresults, offset = 0, count = maxresults) => ({
      json: () => ({
        header: { totalresults, maxresults },
        results: Array.from({ length: count }, (_, i) => createMockAddress(offset + i))
      })
    })

    describe('when totalresults exceeds maxresults', () => {
      it.each([
        { totalresults: 250, maxresults: 100, expectedCalls: 3 },
        { totalresults: 150, maxresults: 100, expectedCalls: 2 },
        { totalresults: 301, maxresults: 100, expectedCalls: 4 }
      ])(
        'fetches all pages when totalresults=$totalresults maxresults=$maxresults',
        async ({ totalresults, maxresults, expectedCalls }) => {
          fetch.mockResolvedValueOnce(createMockResponse(totalresults, maxresults, 0, maxresults))
          for (let i = 1; i < expectedCalls; i++) {
            fetch.mockResolvedValueOnce(createMockResponse(totalresults, maxresults, i * maxresults, maxresults))
          }

          await addressLookupService('test', 'BS1 1AA')

          expect(fetch).toHaveBeenCalledTimes(expectedCalls)
        }
      )

      it('fetches second page with correct offset parameter', async () => {
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 100, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        await addressLookupService('test', 'BS1 1AA')

        expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('offset=100'), expect.any(Object))
      })

      it('fetches third page with correct offset parameter', async () => {
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 100, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        await addressLookupService('test', 'BS1 1AA')

        expect(fetch).toHaveBeenNthCalledWith(3, expect.stringContaining('offset=200'), expect.any(Object))
      })

      it('aggregates results from all pages', async () => {
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 100, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        const results = await addressLookupService(null, 'BS1 1AA')

        expect(results).toHaveLength(250)
      })

      it('applies premises filter to aggregated results', async () => {
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 100, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        const results = await addressLookupService('150', 'BS1 1AA')

        expect(results).toHaveLength(1)
      })
    })

    describe('when totalresults does not exceed maxresults', () => {
      it.each([
        { totalresults: 100, maxresults: 100, description: 'equal to maxresults' },
        { totalresults: 50, maxresults: 100, description: 'less than maxresults' }
      ])('does not fetch additional pages when $description', async ({ totalresults, maxresults }) => {
        fetch.mockResolvedValueOnce(createMockResponse(totalresults, maxresults, 0, totalresults))

        await addressLookupService('test', 'BS1 1AA')

        expect(fetch).toHaveBeenCalledTimes(1)
      })

      it('does not fetch additional pages when header is missing', async () => {
        fetch.mockResolvedValueOnce({
          json: () => ({
            results: [createMockAddress(0)]
          })
        })

        await addressLookupService('test', 'BS1 1AA')

        expect(fetch).toHaveBeenCalledTimes(1)
      })
    })

    describe('cap functionality', () => {
      beforeAll(() => {
        process.env.ADDRESS_LOOKUP_MAX_RESULTS = '5000'
      })

      afterAll(() => {
        delete process.env.ADDRESS_LOOKUP_MAX_RESULTS
      })

      it('limits fetching to cap when totalresults exceeds cap', async () => {
        fetch.mockResolvedValueOnce(createMockResponse(10000, 100, 0, 100))
        // Cap at 5000 = 50 pages, so 1 + 49 additional = 50 total
        for (let i = 1; i < 50; i++) {
          fetch.mockResolvedValueOnce(createMockResponse(10000, 100, i * 100, 100))
        }

        await addressLookupService('test', 'BS1 1AA')

        expect(fetch).toHaveBeenCalledTimes(50)
      })

      it('logs warning when cap is reached', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
        fetch.mockResolvedValueOnce(createMockResponse(10000, 100, 0, 100))
        for (let i = 1; i < 50; i++) {
          fetch.mockResolvedValueOnce(createMockResponse(10000, 100, i * 100, 100))
        }

        await addressLookupService('test', 'BS1 1AA')

        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('totalresults 10000 exceeds cap 5000'))
        consoleWarnSpy.mockRestore()
      })

      it('does not log warning when totalresults within cap', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 100, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        await addressLookupService('test', 'BS1 1AA')

        expect(consoleWarnSpy).not.toHaveBeenCalled()
        consoleWarnSpy.mockRestore()
      })

      it('returns only first page results when cap is less than maxresults', async () => {
        process.env.ADDRESS_LOOKUP_MAX_RESULTS = '50'
        fetch.mockResolvedValueOnce(createMockResponse(200, 100, 0, 100))

        const results = await addressLookupService('test', 'BS1 1AA')

        expect(results).toHaveLength(100)
        delete process.env.ADDRESS_LOOKUP_MAX_RESULTS
      })

      it('does not fetch additional pages when cap is less than maxresults', async () => {
        process.env.ADDRESS_LOOKUP_MAX_RESULTS = '50'
        fetch.mockResolvedValueOnce(createMockResponse(200, 100, 0, 100))

        await addressLookupService('test', 'BS1 1AA')

        expect(fetch).toHaveBeenCalledTimes(1)
        delete process.env.ADDRESS_LOOKUP_MAX_RESULTS
      })
    })

    describe('partial failure handling', () => {
      it('returns successful pages even when some pages fail', async () => {
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockRejectedValueOnce(new Error('Network error'))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        const results = await addressLookupService(null, 'BS1 1AA')

        expect(results).toHaveLength(150)
      })

      it('logs failed pages to console.error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockRejectedValueOnce(new Error('Network error'))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        await addressLookupService(null, 'BS1 1AA')

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch 1 pages'),
          expect.objectContaining({ offsets: [100] })
        )
        consoleErrorSpy.mockRestore()
      })

      it('logs error messages for failed pages', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockRejectedValueOnce(new Error('Network error'))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        await addressLookupService(null, 'BS1 1AA')

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ errors: ['Network error'] }))
        consoleErrorSpy.mockRestore()
      })

      it('does not log error when all pages succeed', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 100, 100))
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        await addressLookupService(null, 'BS1 1AA')

        expect(consoleErrorSpy).not.toHaveBeenCalled()
        consoleErrorSpy.mockRestore()
      })

      it('logs "Unknown error" when failed page has no error message', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 0, 100))
        fetch.mockRejectedValueOnce({ status: 500 })
        fetch.mockResolvedValueOnce(createMockResponse(250, 100, 200, 50))

        await addressLookupService(null, 'BS1 1AA')

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ errors: ['Unknown error'] }))
        consoleErrorSpy.mockRestore()
      })
    })
  })
})
