import Joi from 'joi'
import * as contactValidation from '../contact.validators.js'
import moment from 'moment'

const INVALID_DATE_ERROR_MESSAGE = '"value" must be in [YYYY-MM-DD] format'

describe('contact validators', () => {
  describe('birthDateValidator', () => {
    const validDate = moment().subtract(1, 'day')

    it('allows a date in the past', async () => {
      const testValue = validDate.format('YYYY-MM-DD')
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValue)).resolves.toEqual(testValue)
    })

    it('allows a date in alternative format', async () => {
      const testValueIn = validDate.format('YYYY-M-D')
      const testValueOut = validDate.format('YYYY-MM-DD')
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValueIn)).resolves.toEqual(testValueOut)
    })

    it('throws if given an invalid format', async () => {
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(validDate.format('YYYY-MM-DDThh:mm:ss'))).rejects.toThrow(
        INVALID_DATE_ERROR_MESSAGE
      )
    })

    it('throws if given an invalid date', async () => {
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync('1-111-19')).rejects.toThrow(INVALID_DATE_ERROR_MESSAGE)
    })

    it('throws if the day is missing', async () => {
      const testValueIn = validDate.format('2000-02-')
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow('Day is missing')
    })

    it('throws if the month is missing', async () => {
      const testValueIn = validDate.format('2000--01')
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow('Month is missing')
    })

    it('throws if the year is missing', async () => {
      const testValueIn = validDate.format('-02-01')
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow('Year is missing')
    })

    it.each([
      ['day and month', '2000--'],
      ['day and year', '-02-'],
      ['month and year', '--01'],
      ['day, month and year', '--']
    ])('throws if %s is missing', async (missing, format) => {
      const testValueIn = validDate.format(format)
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow('Enter the date of birth')
    })

    it('throws if the year is specified as 2 digits', async () => {
      const testValueIn = validDate.format('YY-MM-DD')
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValueIn)).rejects.toThrow(INVALID_DATE_ERROR_MESSAGE)
    })

    it("throws if given tommorow's date", async () => {
      await expect(
        contactValidation.createBirthDateValidator(Joi).validateAsync(moment().add(1, 'days').format('YYYY-MM-DD'))
      ).rejects.toThrow('"value" must be less than or equal to "now"')
    })

    it('throws if given a date of a person aged over 120', async () => {
      await expect(
        contactValidation
          .createBirthDateValidator(Joi)
          .validateAsync(moment().subtract(120, 'years').subtract(1, 'days').format('YYYY-MM-DD'))
      ).rejects.toThrow('"value" date before minimum allowed')
    })
  })

  describe('firstNameValidator', () => {
    describe('converts to title case', () => {
      it.each([
        [' mIchael-hArrY ', 'Michael-Harry'],
        [' érmintrùdé ', 'Érmintrùdé']
      ])('converts %s to %s', async (name, expected) => {
        await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(name)).resolves.toEqual(expected)
      })
    })

    describe('standardises formatting of allowed punctuation and standardises spacing', () => {
      it.each([
        // Standard dash
        ['  Peter  -  Paul  ', 'Peter-Paul'],
        // Endash
        ['Peter – Paul', 'Peter-Paul'],
        // Emdash
        ['Peter — Paul', 'Peter-Paul'],
        // Comma
        ['Peter, Paul,', 'Peter Paul'],
        // Period
        ['Peter . Paul .', 'Peter Paul'],
        ['J.Sue.', 'J Sue']
      ])('converts %s to %s', async (name, expected) => {
        await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(name)).resolves.toEqual(expected)
      })
    })

    describe('allows specific punctuation characters', () => {
      it.each("'-".split(''))('allows the %s character', async c => {
        await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(`Test${c}Separator`)).resolves.toEqual(
          `Test${c}Separator`
        )
      })
    })

    describe('does not allow names containing banned characters', () => {
      it.each('!@£$%^&()+*/{}[];":;|\\?<>§±`~0123456789'.split(''))('does not allow a string containing the %s character', async c => {
        await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(`Mich${c}`)).rejects.toThrow(
          'contains forbidden characters'
        )
      })
    })

    it('allows and trims forenames', async () => {
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(' Peter  Paul ')).resolves.toEqual('Peter Paul')
    })

    it.each([
      ['', '"value" is not allowed to be empty'],
      ['..', '"value" must contain at least 2 alpha characters'],
      ['()', '"value" must contain at least 2 alpha characters'],
      ["''", '"value" must contain at least 2 alpha characters'],
      ['--', '"value" must contain at least 2 alpha characters'],
      ['A', '"value" must contain at least 2 alpha characters'],
      ['A..', '"value" must contain at least 2 alpha characters']
    ])('throws on cases where the forename does not contain sufficient alpha characters - "%s"', async (testValue, expectedError) => {
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(testValue)).rejects.toThrow(expectedError)
    })

    it('throws where the name exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })

    it('allows a range of unicode characters from plane 1', async () => {
      const internationStr = 'ÆÇÉÑØĶŤ'
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(internationStr)).resolves.toEqual('Æçéñøķť')
    })

    it('allows the minimum number of required alpha characters to be configured', async () => {
      // Default to 2
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync('AB')).resolves.toEqual('Ab')
      // Allows customisation of rules using minimumLength property
      await expect(contactValidation.createFirstNameValidator(Joi, { minimumLength: 3 }).validateAsync('AB')).rejects.toThrow(
        '"value" must contain at least 3 alpha characters'
      )
    })
  })

  describe('lastNameValidator', () => {
    describe('converts to title case', () => {
      it.each([
        [' SMITH-JONES ', 'Smith-Jones'],
        ['smith-jones', 'Smith-Jones'],
        ['denver', 'Denver'],
        ['ian st. john', 'Ian St John'],
        ['smythé', 'Smythé'],
        ["O'DELL", "O'Dell"],
        ['mcdonald', 'McDonald'],
        ['macdonald', 'Macdonald'],
        ['macy', 'Macy'],
        ['van doorn', 'van Doorn'],
        ['de vries', 'de Vries'],
        ['van der waals', 'van der Waals'],
        ['van den heuvel', 'van den Heuvel']
      ])('converts %s to %s', async (name, expected) => {
        await expect(contactValidation.createLastNameValidator(Joi).validateAsync(name)).resolves.toEqual(expected)
      })
    })

    describe('standardises formatting of allowed punctuation and standardises spacing', () => {
      it.each([
        // Standard dash
        ['  Bedford  -  Cuffe  ', 'Bedford-Cuffe'],
        // Endash
        ['Bedford – Cuffe', 'Bedford-Cuffe'],
        // Emdash
        ['Bedford — Cuffe', 'Bedford-Cuffe'],
        // Apostrophe
        ["O' Connor", "O'Connor"],
        // Right single quotation mark
        ['O’ Connor', "O'Connor"],
        // Left single quotation mark
        ['O‘ Connor', "O'Connor"],
        // Backtick/Grave Accent
        ['O` Connor', "O'Connor"],
        // Acute Accent
        ['O´ Connor', "O'Connor"],
        // Prime
        ['O′ Connor', "O'Connor"],
        // Reversed prime
        ['O‵ Connor', "O'Connor"],
        // Fullwidth apostrophe
        ['O＇Connor', "O'Connor"],
        // Brackets
        ['Dean ( Senior ) ', 'Dean (Senior)']
      ])('converts %s to %s', async (name, expected) => {
        await expect(contactValidation.createLastNameValidator(Joi).validateAsync(name)).resolves.toEqual(expected)
      })
    })

    describe('allows specific punctuation characters', () => {
      it.each("'-".split(''))('allows the %s character', async c => {
        await expect(contactValidation.createLastNameValidator(Joi).validateAsync(`Test${c}Separator`)).resolves.toEqual(
          `Test${c}Separator`
        )
      })
    })

    describe('does not allow names containing banned characters', () => {
      it.each('!@£$%^&()+*/{}[];":;|\\?<>§±~0123456789'.split(''))('does not allow the %s character', async c => {
        await expect(contactValidation.createLastNameValidator(Joi).validateAsync(`Gra${c}am`)).rejects.toThrow(
          'contains forbidden characters'
        )
      })
    })

    it.each([
      ['', '"value" is not allowed to be empty'],
      ['..', '"value" must contain at least 2 alpha characters'],
      ['()', '"value" must contain at least 2 alpha characters'],
      ["''", '"value" must contain at least 2 alpha characters'],
      ['--', '"value" must contain at least 2 alpha characters'],
      ['A', '"value" must contain at least 2 alpha characters'],
      ['A..', '"value" must contain at least 2 alpha characters']
    ])('throws on cases where the last name does not contain sufficient alpha characters - "%s"', async (testValue, expectedError) => {
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync(testValue)).rejects.toThrow(expectedError)
    })

    it('throws where the name exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })

    it('allows a range of unicode characters from plane 1', async () => {
      const internationStr = 'ÆÇÉÑØĶŤ'
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync(internationStr)).resolves.toEqual('Æçéñøķť')
    })

    it('allows the minimum number of required alpha characters to be configured', async () => {
      // Default to 2
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync('AB')).resolves.toEqual('Ab')
      // Allows customisation of rules using minimumLength property
      await expect(contactValidation.createLastNameValidator(Joi, { minimumLength: 3 }).validateAsync('AB')).rejects.toThrow(
        '"value" must contain at least 3 alpha characters'
      )
    })
  })

  describe('emailValidator', () => {
    it('expects an email with 2 domain segments', async () => {
      await expect(contactValidation.createEmailValidator(Joi).validateAsync('person@example.com')).resolves.toEqual('person@example.com')
    })

    it('throws on a single segment', async () => {
      await expect(contactValidation.createEmailValidator(Joi).validateAsync('person@example')).rejects.toThrow(
        '"value" must be a valid email'
      )
    })
  })

  describe('mobilePhoneValidator', () => {
    it.each(['+44 7700 900088', '07700 900088'])('validates %s successfully', async number => {
      await expect(contactValidation.createMobilePhoneValidator(Joi).validateAsync(number)).resolves.toEqual(number)
    })

    it.each(['test', '07700 test'])('rejects the invalid number %s', async number => {
      await expect(contactValidation.createMobilePhoneValidator(Joi).validateAsync(number)).rejects.toThrow()
    })
  })

  describe('ukPostcodeValidator', () => {
    it.each([
      ['ba21nw', 'BA2 1NW'],
      [' AB12    3CD ', 'AB12 3CD'],
      ['AB123CD ', 'AB12 3CD']
    ])('formats the UK postcode %s successfully as %s', async (postcode, replacedValue) => {
      await expect(contactValidation.createUKPostcodeValidator(Joi).validateAsync(postcode)).resolves.toEqual(replacedValue)
    })

    it('expects a minimum of 1 character', async () => {
      await expect(contactValidation.createUKPostcodeValidator(Joi).validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })
    it('expects a maximum of 12 characters', async () => {
      await expect(contactValidation.createUKPostcodeValidator(Joi).validateAsync('0123456789ABC')).rejects.toThrow(
        '"value" length must be less than or equal to 12 characters long'
      )
    })
    it('expects postcodes to conform to the pattern used in the UK', async () => {
      await expect(contactValidation.createUKPostcodeValidator(Joi).validateAsync('0123456789')).rejects.toThrow(
        /fails to match the required pattern/
      )
    })
  })

  describe('overseasPostcodeValidator', () => {
    it('converts to uppercase and trims', async () => {
      await expect(contactValidation.createOverseasPostcodeValidator(Joi).validateAsync('a ')).resolves.toEqual('A')
    })
    it('expects a minimum of 1 character', async () => {
      await expect(contactValidation.createOverseasPostcodeValidator(Joi).validateAsync('')).rejects.toThrow(
        '"value" is not allowed to be empty'
      )
    })
    it('expects a maximum of 12 characters', async () => {
      await expect(contactValidation.createOverseasPostcodeValidator(Joi).validateAsync('123456789AAAA')).rejects.toThrow()
    })
    it('will not accept special characters', async () => {
      await expect(contactValidation.createOverseasPostcodeValidator(Joi).validateAsync('12£4')).rejects.toThrow()
    })
  })

  describe('premisesValidator', () => {
    it('allows and trims premises', async () => {
      await expect(contactValidation.createPremisesValidator(Joi).validateAsync(' 15 ROSE COTTAGE ')).resolves.toEqual('15 Rose Cottage')
    })

    it('throws on empty premises', async () => {
      await expect(contactValidation.createPremisesValidator(Joi).validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the premises exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createPremisesValidator(Joi).validateAsync('A'.repeat(51))).rejects.toThrow(
        '"value" length must be less than or equal to 50 characters long'
      )
    })
  })

  describe('streetValidator', () => {
    it('allows and trims street', async () => {
      await expect(contactValidation.createStreetValidator(Joi).validateAsync(' BOND STREET ')).resolves.toEqual('Bond Street')
    })

    it('allows empty street', async () => {
      await expect(contactValidation.createStreetValidator(Joi).validateAsync('')).resolves.toBeFalsy()
    })

    it('throws where the street exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createStreetValidator(Joi).validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })
  })

  describe('localityValidator', () => {
    it('allows and trims locality', async () => {
      await expect(contactValidation.createLocalityValidator(Joi).validateAsync(' MAYFAIR ')).resolves.toEqual('Mayfair')
    })

    it('allows empty locality', async () => {
      await expect(contactValidation.createLocalityValidator(Joi).validateAsync('')).resolves.toBeFalsy()
    })

    it('throws where the locality exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createLocalityValidator(Joi).validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })
  })

  describe('townValidator', () => {
    describe('converts to title case', () => {
      it.each([
        ['lOndon', 'London'],
        ['newcastle upon tyne', 'Newcastle upon Tyne'],
        ['wotton-under-edge', 'Wotton-under-Edge'],
        ['barrow-in-ferness', 'Barrow-in-Ferness'],
        ['stoke-on-trent', 'Stoke-on-Trent'],
        ['sutton cum lound', 'Sutton cum Lound'],
        ['wells-next-the-sea', 'Wells-next-the-Sea'],
        ['chapel-en-le-frith', 'Chapel-en-le-Frith'],
        ['puddleby-on-the-marsh', 'Puddleby-on-the-Marsh'],
        ['weston-super-mare', 'Weston-super-Mare']
      ])('converts %s to %s', async (name, expected) => {
        await expect(contactValidation.createTownValidator(Joi).validateAsync(name)).resolves.toEqual(expected)
      })
    })

    it('allows and trims town', async () => {
      await expect(contactValidation.createTownValidator(Joi).validateAsync(' LONDON ')).resolves.toEqual('London')
    })

    it('throws on empty town', async () => {
      await expect(contactValidation.createTownValidator(Joi).validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the town exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createTownValidator(Joi).validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })
  })

  describe('nationalInsuranceNumberValidator', () => {
    it('Allows valid NI number AB123456A', async () => {
      await expect(contactValidation.createNationalInsuranceNumberValidator(Joi).validateAsync('AB123456A')).resolves.toEqual(
        'AB 12 34 56 A'
      )
    })
    it('Disallows invalid NI number QQ123456A', async () => {
      await expect(contactValidation.createNationalInsuranceNumberValidator(Joi).validateAsync('QQ123456A')).rejects.toThrow()
    })
    it('Disallows invalid NI number BG123456A', async () => {
      await expect(contactValidation.createNationalInsuranceNumberValidator(Joi).validateAsync('QQ123456A')).rejects.toThrow()
    })
  })
})
