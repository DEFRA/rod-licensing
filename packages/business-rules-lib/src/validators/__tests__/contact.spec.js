import Joi from '@hapi/joi'
import * as contactValidation from '../contact.js'
import moment from 'moment'

describe('contact validators', () => {
  describe('birthDateValidator', () => {
    const validDate = moment().subtract(1, 'day')

    it('allows a date in the past', async () => {
      const testValue = validDate.format('YYYY-MM-DD')
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValue)).resolves.toEqual(testValue)
    })

    it('allows a date in alternative format', async () => {
      const testValueIn = validDate.format('YY-MM-DD')
      const testValueOut = validDate.format('YYYY-MM-DD')
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(testValueIn)).resolves.toEqual(testValueOut)
    })

    it('throws if given an invalid format', async () => {
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync(validDate.format('YYYY-MM-DDThh:mm:ss'))).rejects.toThrow(
        '"value" must be in [YYYY-MM-DD] format'
      )
    })

    it('throws if given an invalid date', async () => {
      await expect(contactValidation.createBirthDateValidator(Joi).validateAsync('1-111-19')).rejects.toThrow(
        '"value" must be in [YYYY-MM-DD] format'
      )
    })

    it("throws if given tommorow's date", async () => {
      await expect(
        contactValidation.createBirthDateValidator(Joi).validateAsync(
          moment()
            .add(1, 'days')
            .format('YYYY-MM-DD')
        )
      ).rejects.toThrow('"value" must be less than or equal to "now"')
    })

    it('throws if given a date of a person aged over 120', async () => {
      await expect(
        contactValidation.createBirthDateValidator(Joi).validateAsync(
          moment()
            .subtract(120, 'years')
            .subtract(1, 'days')
            .format('YYYY-MM-DD')
        )
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

    describe('allows specific punctuation characters', () => {
      it.each("'-".split(''))('allows the %s character', async c => {
        await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(`Test${c}`)).resolves.toEqual(`Test${c}`)
      })
    })

    describe('does not allow banned characters', () => {
      it.each('!@£$%^&()+*/{}[];":;|\\?<>§±`~0123456789'.split(''))('does not allow the %s character', async c => {
        await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(c)).rejects.toThrow('contains forbidden characters')
      })
    })

    it('allows and trims forenames', async () => {
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(' John ')).resolves.toEqual('John')
    })

    it('throws on empty forenames', async () => {
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the name exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })

    it('throws where the name is a single character', async () => {
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync('A')).rejects.toThrow(
        '"value" length must be at least 2 characters long'
      )
    })

    it('allows a range of unicode characters from plane 1', async () => {
      const internationStr = 'ÆÇÉÑØĶŤ'
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(internationStr)).resolves.toEqual('Æçéñøķť')
    })
  })

  describe('lastNameValidator', () => {
    describe('converts to title case', () => {
      it.each([
        [' SMITH-JONES ', 'Smith-Jones'],
        ['smith-jones', 'Smith-Jones'],
        ['denver', 'Denver'],
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

    describe('allows specific punctuation characters', () => {
      it.each("'-".split(''))('allows the %s character', async c => {
        await expect(contactValidation.createLastNameValidator(Joi).validateAsync(`Test${c}`)).resolves.toEqual(`Test${c}`)
      })
    })

    describe('does not allow banned characters', () => {
      it.each('!@£$%^&()+*/{}[];":;|\\?<>§±`~0123456789'.split(''))('does not allow the %s character', async c => {
        await expect(contactValidation.createLastNameValidator(Joi).validateAsync(c)).rejects.toThrow('contains forbidden characters')
      })
    })

    it('throws on empty last names', async () => {
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the name exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })

    it('throws where the name is a single character', async () => {
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync('A')).rejects.toThrow(
        '"value" length must be at least 2 characters long'
      )
    })

    it('allows a range of unicode characters from plane 1', async () => {
      const internationStr = 'ÆÇÉÑØĶŤ'
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync(internationStr)).resolves.toEqual('Æçéñøķť')
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
  })

  describe('premisesValidator', () => {
    it('allows and trims premises', async () => {
      await expect(contactValidation.createPremisesValidator(Joi).validateAsync(' 15 ROSE COTTAGE ')).resolves.toEqual('15 Rose Cottage')
    })

    it('throws on empty premises', async () => {
      await expect(contactValidation.createPremisesValidator(Joi).validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the premises exceeds the maximum allowed length', async () => {
      await expect(contactValidation.createPremisesValidator(Joi).validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
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
})
