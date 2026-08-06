import addressLookupService from '../address-lookup-service.js'
import fetch from 'node-fetch'

jest.mock('node-fetch')

describe('address-lookup-service', () => {
  const createMockAddress = ({
    buildingName,
    buildingNumber,
    classificationCode,
    dependentLocality,
    dependentThoroughfareName,
    doubleDependentLocality,
    organisationName,
    poBoxNumber,
    subBuildingName,
    thoroughfareName
  }) => ({
    DPA: {
      ADDRESS: 'FISHCORP, FISH BOULEVARD, FISHBOROUGH, FI1 5SH',
      BUILDING_NUMBER: buildingNumber,
      BUILDING_NAME: buildingName,
      CLASSIFICATION_CODE: classificationCode,
      DEPENDENT_LOCALITY: dependentLocality,
      DEPENDENT_THOROUGHFARE_NAME: dependentThoroughfareName,
      DOUBLE_DEPENDENT_LOCALITY: doubleDependentLocality,
      ORGANISATION_NAME: organisationName,
      PO_BOX_NUMBER: poBoxNumber,
      POST_TOWN: 'BRISTOL',
      POSTCODE: 'BS1 1AA',
      SUB_BUILDING_NAME: subBuildingName,
      THOROUGHFARE_NAME: thoroughfareName
    }
  })

  beforeAll(() => {
    process.env.ADDRESS_LOOKUP_KEY = 'ADDRESS_LOOKUP_KEY'
    process.env.ADDRESS_LOOKUP_URL = 'https://address.lookup.url'
    process.env.ADDRESS_LOOKUP_MS = '10000'
  })
  beforeEach(jest.clearAllMocks)

  describe('default', () => {
    it('calls the address lookup with the correct parameters', async () => {
      fetch.mockResolvedValue({ json: () => Promise.resolve({}) })

      await addressLookupService('test', 'BS1 1AA')

      const expectedUrl = [process.env.ADDRESS_LOOKUP_URL, '/?postcode=', 'BS1+1AA', '&lr=EN&key=', process.env.ADDRESS_LOOKUP_KEY].join('')
      expect(fetch).toHaveBeenCalledWith(expectedUrl, {
        headers: { 'Content-Type': 'application/json' },
        timeout: process.env.ADDRESS_LOOKUP_MS
      })
    })

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
                  POST_TOWN: town
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

  describe('premises field', () => {
    it.each`
      desc                                                                  | expected                                    | searchPremises   | classificationCode | poBoxNumber  | subBuildingName | buildingName     | buildingNumber | organisationName
      ${'everything but ORGANISATION_NAME is blank'}                        | ${'FishCorp'}                               | ${'FishCorp'}    | ${undefined}       | ${undefined} | ${undefined}    | ${undefined}     | ${undefined}   | ${'FishCorp'}
      ${'CLASSIFICATION_CODE is blank'}                                     | ${'12345, Flat 3A, Fish Towers, 42'}        | ${'Flat 3A'}     | ${undefined}       | ${'12345'}   | ${'Flat 3A'}    | ${'Fish Towers'} | ${'42'}        | ${'FishCorp'}
      ${'CLASSIFICATION_CODE is for PO box'}                                | ${'PO BOX 12345'}                           | ${'12345'}       | ${'OR3'}           | ${'12345'}   | ${undefined}    | ${undefined}     | ${undefined}   | ${'FishCorp'}
      ${'CLASSIFICATION_CODE is for PO box but other fields are present'}   | ${'PO BOX 12345, Flat 3A, Fish Towers, 42'} | ${'Flat 3A'}     | ${'OR3'}           | ${'12345'}   | ${'Flat 3A'}    | ${'Fish Towers'} | ${'42'}        | ${'FishCorp'}
      ${'CLASSIFICATION_CODE is for PO box but PO_BOX_NUMBER is blank'}     | ${'Flat 3A, Fish Towers, 42'}               | ${'Flat 3A'}     | ${'OR3'}           | ${undefined} | ${'Flat 3A'}    | ${'Fish Towers'} | ${'42'}        | ${'FishCorp'}
      ${'SUB_BUILDING_NAME, BUILDING_NAME and BUILDING_NUMBER are present'} | ${'Flat 3A, Fish Towers, 42'}               | ${'Flat 3A'}     | ${'RD04'}          | ${undefined} | ${'Flat 3A'}    | ${'Fish Towers'} | ${'42'}        | ${'FishCorp'}
      ${'SUB_BUILDING_NAME and BUILDING_NAME are present'}                  | ${'Flat 3A, Fish Towers'}                   | ${'Flat 3A'}     | ${'RD04'}          | ${undefined} | ${'Flat 3A'}    | ${'Fish Towers'} | ${undefined}   | ${'FishCorp'}
      ${'SUB_BUILDING_NAME and BUILDING_NUMBER are present'}                | ${'Flat 3A, 42'}                            | ${'Flat 3A'}     | ${'RD04'}          | ${undefined} | ${'Flat 3A'}    | ${undefined}     | ${'42'}        | ${'FishCorp'}
      ${'BUILDING_NAME and BUILDING_NUMBER are present'}                    | ${'Fish Towers, 42'}                        | ${'42'}          | ${'RD04'}          | ${undefined} | ${undefined}    | ${'Fish Towers'} | ${'42'}        | ${'FishCorp'}
      ${'BUILDING_NAME is present'}                                         | ${'Fish Towers'}                            | ${'Fish Towers'} | ${'RD04'}          | ${undefined} | ${undefined}    | ${'Fish Towers'} | ${undefined}   | ${'FishCorp'}
      ${'BUILDING_NUMBER is present'}                                       | ${'42'}                                     | ${'42'}          | ${'RD04'}          | ${undefined} | ${undefined}    | ${undefined}     | ${'42'}        | ${'FishCorp'}
      ${'BUILDING_NAME is present and BUILDING_NUMBER is an empty string'}  | ${'Fish Towers'}                            | ${'Fish Towers'} | ${'RD04'}          | ${undefined} | ${undefined}    | ${'Fish Towers'} | ${''}          | ${'FishCorp'}
      ${'BUILDING_NAME is present and BUILDING_NUMBER is spaces'}           | ${'Fish Towers'}                            | ${'Fish Towers'} | ${'RD04'}          | ${undefined} | ${undefined}    | ${'Fish Towers'} | ${'  '}        | ${'FishCorp'}
      ${'BUILDING_NAME is present and BUILDING_NUMBER is null'}             | ${'Fish Towers'}                            | ${'Fish Towers'} | ${'RD04'}          | ${undefined} | ${undefined}    | ${'Fish Towers'} | ${null}        | ${'FishCorp'}
      ${'BUILDING_NUMBER is 0 string'}                                      | ${'0'}                                      | ${'0'}           | ${'RD04'}          | ${undefined} | ${undefined}    | ${undefined}     | ${'0'}         | ${'FishCorp'}
      ${'BUILDING_NUMBER is 0 integer'}                                     | ${'0'}                                      | ${'0'}           | ${'RD04'}          | ${undefined} | ${undefined}    | ${undefined}     | ${0}           | ${'FishCorp'}
    `(
      'when $desc it saves a premises field with correct value',
      async ({
        expected,
        searchPremises,
        classificationCode,
        poBoxNumber,
        subBuildingName,
        buildingName,
        buildingNumber,
        organisationName
      }) => {
        fetch.mockResolvedValueOnce({
          json: () => ({
            results: [
              createMockAddress({ buildingName, buildingNumber, classificationCode, organisationName, poBoxNumber, subBuildingName })
            ]
          })
        })
        const results = await addressLookupService(searchPremises, 'BS1 1AA')
        expect(results[0].premises).toBe(expected)
      }
    )
  })

  describe('street field', () => {
    it.each`
      desc                                                                                 | expected                        | dependentThoroughfareName | thoroughfareName
      ${'DEPENDENT_THOROUGHFARE_NAME and THOROUGHFARE_NAME are present'}                   | ${'Trout Terrace, Fish Street'} | ${'Trout Terrace'}        | ${'Fish Street'}
      ${'only DEPENDENT_THOROUGHFARE_NAME is present'}                                     | ${'Trout Terrace'}              | ${'Trout Terrace'}        | ${undefined}
      ${'only THOROUGHFARE_NAME is present'}                                               | ${'Fish Street'}                | ${undefined}              | ${'Fish Street'}
      ${'THOROUGHFARE_NAME is present and DEPENDENT_THOROUGHFARE_NAME is an empty string'} | ${'Fish Street'}                | ${''}                     | ${'Fish Street'}
      ${'THOROUGHFARE_NAME is present and DEPENDENT_THOROUGHFARE_NAME is spaces'}          | ${'Fish Street'}                | ${'     '}                | ${'Fish Street'}
      ${'THOROUGHFARE_NAME is present and DEPENDENT_THOROUGHFARE_NAME is null'}            | ${'Fish Street'}                | ${null}                   | ${'Fish Street'}
      ${'no valid street fields are present'}                                              | ${''}                           | ${undefined}              | ${undefined}
    `('when $desc it saves a street field with correct value', async ({ expected, dependentThoroughfareName, thoroughfareName }) => {
      const searchPremises = '5'
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [createMockAddress({ buildingNumber: searchPremises, dependentThoroughfareName, thoroughfareName })]
        })
      })
      const results = await addressLookupService(searchPremises, 'BS1 1AA')
      expect(results[0].street).toBe(expected)
    })
  })

  describe('locality field', () => {
    it.each`
      desc                                                                                | expected                       | doubleDependentLocality | dependentLocality
      ${'DOUBLE_DEPENDENT_LOCALITY and DEPENDENT_LOCALITY are present'}                   | ${'Salmonville, Isle of Pike'} | ${'Salmonville'}        | ${'Isle of Pike'}
      ${'only DOUBLE_DEPENDENT_LOCALITY is present'}                                      | ${'Salmonville'}               | ${'Salmonville'}        | ${undefined}
      ${'only DEPENDENT_LOCALITY is present'}                                             | ${'Isle of Pike'}              | ${undefined}            | ${'Isle of Pike'}
      ${'DEPENDENT_LOCALITY is present and DOUBLE_DEPENDENT_LOCALITY is an empty string'} | ${'Isle of Pike'}              | ${''}                   | ${'Isle of Pike'}
      ${'DEPENDENT_LOCALITY is present and DOUBLE_DEPENDENT_LOCALITY is spaces'}          | ${'Isle of Pike'}              | ${'     '}              | ${'Isle of Pike'}
      ${'DEPENDENT_LOCALITY is present and DOUBLE_DEPENDENT_LOCALITY is null'}            | ${'Isle of Pike'}              | ${null}                 | ${'Isle of Pike'}
      ${'no valid locality fields are present'}                                           | ${''}                          | ${undefined}            | ${undefined}
    `('when $desc it saves a locality field with correct value', async ({ expected, doubleDependentLocality, dependentLocality }) => {
      const searchPremises = '5'
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [createMockAddress({ buildingNumber: searchPremises, doubleDependentLocality, dependentLocality })]
        })
      })
      const results = await addressLookupService(searchPremises, 'BS1 1AA')
      expect(results[0].locality).toBe(expected)
    })
  })

  describe('filterAndOrderResults', () => {
    describe.each`
      snakeCaseField         | camelCaseField
      ${'SUB_BUILDING_NAME'} | ${'subBuildingName'}
      ${'BUILDING_NAME'}     | ${'buildingName'}
      ${'BUILDING_NUMBER'}   | ${'buildingNumber'}
      ${'PO_BOX_NUMBER'}     | ${'poBoxNumber'}
    `('matches within $camelCaseField', ({ snakeCaseField, camelCaseField }) => {
      describe.each(['trout', 'TROUT', '1', '100', '1A'])('when the term is %s', term => {
        it(`returns matches where the ${snakeCaseField} exactly matches the term ${term}`, async () => {
          fetch.mockResolvedValueOnce({
            json: () => ({
              results: [createMockAddress({ [camelCaseField]: term })]
            })
          })
          const results = await addressLookupService(term, 'FI1 5SH')
          expect(results[0].premises).toBe(term)
        })

        it(`returns matches where the ${snakeCaseField} contains the term ${term}, but the user entered it with whitespace`, async () => {
          fetch.mockResolvedValueOnce({
            json: () => ({
              results: [createMockAddress({ [camelCaseField]: term })]
            })
          })
          const results = await addressLookupService(`  ${term}  `, 'FI1 5SH')
          expect(results[0].premises).toBe(term)
        })

        it(`returns matches where the ${snakeCaseField} contains the term ${term}, but the user entered it with parentheses`, async () => {
          fetch.mockResolvedValueOnce({
            json: () => ({
              results: [createMockAddress({ [camelCaseField]: term })]
            })
          })
          const results = await addressLookupService(`(${term})`, 'FI1 5SH')
          expect(results[0].premises).toBe(term)
        })

        it(`returns matches where the ${snakeCaseField} includes the term ${term} as one of several distinct strings`, async () => {
          const validMatches = [
            `${term} ${term}`,
            `${term} foo`,
            `foo ${term}`,
            `foo ${term} bar`,
            `foo-${term}`,
            `${term}`.toUpperCase(),
            `${term}`,
            `${term}, foo`,
            `foo.${term}`
          ]
          const addresses = []
          for (const match of validMatches) {
            addresses.push(createMockAddress({ [camelCaseField]: match }))
          }
          fetch.mockResolvedValueOnce({ json: () => ({ results: addresses }) })

          const results = await addressLookupService(term, 'FI1 5SH')
          expect(results.map(r => r.premises)).toEqual(addresses.map(a => a.DPA[snakeCaseField]))
        })

        it(`does not return matches where the ${snakeCaseField} includes the term ${term} within a longer string`, async () => {
          const invalidMatches = [`${term}foo`, `foo${term}`, `foo${term}bar`, `${term}${term}`]
          const addresses = []
          for (const match of invalidMatches) {
            addresses.push(createMockAddress({ [camelCaseField]: match }))
          }
          fetch.mockResolvedValueOnce({ json: () => ({ results: addresses }) })

          const results = await addressLookupService(term, 'FI1 5SH')
          expect(results).toHaveLength(0)
        })

        it(`when there is a mixture of matching and non-matching results for ${term} in ${snakeCaseField}, returns only the matching results`, async () => {
          const validAddress = createMockAddress({ [camelCaseField]: term })
          const invalidAddress = createMockAddress({ [camelCaseField]: `${term}foo` })
          const anotherValidAddress = createMockAddress({ [camelCaseField]: `Flat ${term}` })
          const anotherInvalidAddress = createMockAddress({ [camelCaseField]: 'foobarbaz' })
          fetch.mockResolvedValueOnce({
            json: () => ({ results: [validAddress, invalidAddress, anotherValidAddress, anotherInvalidAddress] })
          })

          const results = await addressLookupService(term, 'FI1 5SH')
          const validAddresses = [validAddress, anotherValidAddress]
          expect(results.map(r => r.premises)).toEqual(validAddresses.map(a => a.DPA[snakeCaseField]))
        })
      })

      it(`does not return matches where the ${snakeCaseField} has a similar but non-matching term`, async () => {
        const term = 'trout'
        const invalidMatches = ['trut', 'troutt', 'grout', 'trou', 'trowt']
        const addresses = []
        for (const match of invalidMatches) {
          addresses.push(createMockAddress({ [camelCaseField]: match }))
        }
        fetch.mockResolvedValueOnce({ json: () => ({ results: addresses }) })

        const results = await addressLookupService(term, 'FI1 5SH')
        expect(results).toHaveLength(0)
      })

      it(`does not return matches where the ${snakeCaseField} has a partial numeric match`, async () => {
        const term = '1'
        const invalidMatches = ['1A', '11', '21', '100', '301']
        const addresses = []
        for (const match of invalidMatches) {
          addresses.push(createMockAddress({ [camelCaseField]: match }))
        }
        fetch.mockResolvedValueOnce({ json: () => ({ results: addresses }) })

        const results = await addressLookupService(term, 'FI1 5SH')
        expect(results).toHaveLength(0)
      })

      it('does not return matches for "the"', async () => {
        fetch.mockResolvedValueOnce({
          json: () => ({
            results: [createMockAddress({ [camelCaseField]: 'the' })]
          })
        })

        const results = await addressLookupService('the', 'FI1 5SH')
        expect(results).toHaveLength(0)
      })

      it.each(['there', 'lathe', 'anthem'])(
        'does return matches when the term includes "the" as part of a longer string, ie "%s"',
        async term => {
          fetch.mockResolvedValueOnce({
            json: () => ({
              results: [createMockAddress({ [camelCaseField]: term })]
            })
          })

          const results = await addressLookupService(term, 'FI1 5SH')
          expect(results[0].premises).toBe(term)
        }
      )
    })

    it.each(['1', '100', '11FOO'])('matches PO_BOX_NUMBER with added label when classificationCode is OR3', async term => {
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [createMockAddress({ poBoxNumber: term, classificationCode: 'OR3' })]
        })
      })

      const results = await addressLookupService(term, 'FI1 5SH')
      expect(results[0].premises).toBe(`PO BOX ${term}`)
    })

    it.each`
      snakeCaseField           | camelCaseField
      ${'BUILDING_NAME'}       | ${'buildingName'}
      ${'CLASSIFICATION_CODE'} | ${'classificationCode'}
      ${'BUILDING_NUMBER'}     | ${'buildingNumber'}
      ${'PO_BOX_NUMBER'}       | ${'poBoxNumber'}
      ${'SUB_BUILDING_NAME'}   | ${'subBuildingName'}
    `('does not match to ORGANISATION_NAME if $snakeCaseField is present', async ({ camelCaseField }) => {
      const term = 'Ministry of Salmon'
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [
            createMockAddress({
              organisationName: term,
              [camelCaseField]: 'foo'
            })
          ]
        })
      })

      const results = await addressLookupService(term, 'FI1 5SH')
      expect(results).toHaveLength(0)
    })

    it('matches to ORGANISATION_NAME if no other valid fields are present', async () => {
      const term = 'Ministry of Salmon'
      fetch.mockResolvedValueOnce({
        json: () => ({
          results: [createMockAddress({ organisationName: term })]
        })
      })

      const results = await addressLookupService(term, 'FI1 5SH')
      expect(results[0].premises).toBe(term)
    })

    describe('match ordering', () => {
      it('prioritises matches with more matching strings', async () => {
        const exactMatch = 'foo bar baz'
        const partialMatch = 'foo bar'
        const anotherPartialMatch = 'foo baz'
        const onlyMatchesABit = 'foo'
        const notAMatchAtAll = 'salmon'

        const orderedAddresses = [exactMatch, partialMatch, anotherPartialMatch, onlyMatchesABit]
        const disorderedAddresses = [partialMatch, notAMatchAtAll, onlyMatchesABit, exactMatch, anotherPartialMatch]
        const addressResults = []
        for (const address of disorderedAddresses) {
          addressResults.push(createMockAddress({ buildingName: address }))
        }
        fetch.mockResolvedValueOnce({ json: () => ({ results: addressResults }) })

        const results = await addressLookupService(exactMatch, 'FI1 5SH')
        expect(results.map(r => r.premises)).toEqual(orderedAddresses)
      })

      it('prioritises matches on strings that contain letters and digits', async () => {
        const term = 'foo 1A 100'
        const matchesLettersAndDigits = 'bar 1A 200'
        const alsoMatchesLettersAndDigits = 'baz 1A 300'
        const matchesLettersOnly = 'foo 2B 200'
        const alsoMatchesLettersOnly = 'foo 3C 300'
        const matchesDigitsOnly = 'bar 2B 100'
        const alsoMatchesDigitsOnly = 'baz 3C 100'
        const doesNotMatch = 'bar 2B 200'
        const alsoDoesNotMatch = 'baz 3C 300'

        const orderedAddresses = [
          matchesLettersAndDigits,
          alsoMatchesLettersAndDigits,
          matchesDigitsOnly,
          matchesLettersOnly,
          alsoMatchesLettersOnly,
          alsoMatchesDigitsOnly
        ]
        const disorderedAddresses = [
          matchesDigitsOnly,
          doesNotMatch,
          matchesLettersOnly,
          alsoDoesNotMatch,
          matchesLettersAndDigits,
          alsoMatchesLettersOnly,
          alsoMatchesLettersAndDigits,
          alsoMatchesDigitsOnly
        ]
        const addressResults = []
        for (const address of disorderedAddresses) {
          addressResults.push(createMockAddress({ buildingName: address }))
        }
        fetch.mockResolvedValueOnce({ json: () => ({ results: addressResults }) })

        const results = await addressLookupService(term, 'FI1 5SH')
        expect(results.map(r => r.premises)).toEqual(orderedAddresses)
      })

      it('prioritises matches that score highest based on multiple criteria', async () => {
        const term = 'foo bar baz 1A'
        const shouldScoreFivePoints = 'foo bar baz 1A'
        const shouldScoreFourPoints = 'foo baz 1A'
        const shouldScoreThreePoints = 'foo bar baz'
        const shouldScoreTwoPoints = '1A'
        const shouldScoreOnePoint = 'baz'
        const shouldScoreZeroPoints = 'trout'

        const orderedAddresses = [
          shouldScoreFivePoints,
          shouldScoreFourPoints,
          shouldScoreThreePoints,
          shouldScoreTwoPoints,
          shouldScoreOnePoint
        ]
        const disorderedAddresses = [
          shouldScoreTwoPoints,
          shouldScoreFourPoints,
          shouldScoreOnePoint,
          shouldScoreFivePoints,
          shouldScoreZeroPoints,
          shouldScoreThreePoints
        ]
        const addressResults = []
        for (const address of disorderedAddresses) {
          addressResults.push(createMockAddress({ buildingName: address }))
        }
        fetch.mockResolvedValueOnce({ json: () => ({ results: addressResults }) })

        const results = await addressLookupService(term, 'FI1 5SH')
        expect(results.map(r => r.premises)).toEqual(orderedAddresses)
      })

      it('prioritises matches even when matching terms are spread across multiple fields', async () => {
        const term = 'foo bar baz 1A'
        const shouldScoreFourPoints = {
          subBuildingName: 'foo',
          buildingName: 'baz',
          buildingNumber: '1A',
          expectedPremises: 'foo, baz, 1A'
        }
        const shouldScoreThreePoints = { subBuildingName: '1A', buildingName: 'baz', expectedPremises: '1A, baz' }
        const shouldScoreTwoPoints = { subBuildingName: 'foo', buildingName: 'bar', expectedPremises: 'foo, bar' }
        const shouldScoreOnePoint = { buildingName: 'baz', expectedPremises: 'baz' }
        const shouldScoreZeroPoints = { buildingNumber: '500', expectedPremises: '500' }

        const orderedAddresses = [shouldScoreFourPoints, shouldScoreThreePoints, shouldScoreTwoPoints, shouldScoreOnePoint]
        const disorderedAddresses = [
          shouldScoreOnePoint,
          shouldScoreFourPoints,
          shouldScoreZeroPoints,
          shouldScoreTwoPoints,
          shouldScoreThreePoints
        ]
        const addressResults = []
        for (const address of disorderedAddresses) {
          addressResults.push(createMockAddress(address))
        }
        fetch.mockResolvedValueOnce({ json: () => ({ results: addressResults }) })

        const results = await addressLookupService(term, 'FI1 5SH')
        expect(results.map(r => r.premises)).toEqual(orderedAddresses.map(a => a.expectedPremises))
      })
    })

    it('returns all OS Places results if no premise search term is provided', async () => {
      const addresses = [
        { subBuildingName: 'Flat 1A', buildingName: 'Fish Towers', expectedPremises: 'Flat 1A, Fish Towers' },
        { buildingNumber: '100', expectedPremises: '100' },
        { buildingName: 'Fish Cottage', expectedPremises: 'Fish Cottage' }
      ]
      const addressResults = []
      for (const address of addresses) {
        addressResults.push(createMockAddress(address))
      }
      fetch.mockResolvedValueOnce({ json: () => ({ results: addressResults }) })

      const results = await addressLookupService(undefined, 'FI1 5SH')
      expect(results.map(r => r.premises)).toEqual(addresses.map(a => a.expectedPremises))
    })
  })

  describe('handles missing optional fields', () => {
    it.each([
      ['DEPENDENT_LOCALITY', 'locality', { BUILDING_NAME: '1 MAIN STREET', POST_TOWN: 'BRISTOL' }],
      ['POST_TOWN', 'town', { BUILDING_NAME: '1 MAIN STREET' }]
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
    const createMockResponse = (totalresults, maxresults, offset = 0, count = maxresults) => ({
      json: () => ({
        header: { totalresults, maxresults },
        results: Array.from({ length: count }, (_, i) =>
          createMockAddress({
            buildingNumber: `${offset + i}`,
            buildingName: 'TEST TOWERS',
            classificationCode: 'RD04'
          })
        )
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
            results: [createMockAddress({ buildingNumber: 0 })]
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
