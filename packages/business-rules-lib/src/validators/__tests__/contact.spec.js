import each from 'jest-each'
import * as contactValidation from '../contact.js'
import moment from 'moment'

describe('contact validators', () => {
  describe('birthDateValidator', () => {
    const validDate = moment().subtract(1, 'day')

    it('allows a date in the past', async () => {
      const testValue = validDate.format('YYYY-MM-DD')
      await expect(contactValidation.birthDateValidator.validateAsync(testValue)).resolves.toEqual(testValue)
    })

    it('allows a date in alternative format', async () => {
      const testValueIn = validDate.format('YY-MM-DD')
      const testValueOut = validDate.format('YYYY-MM-DD')
      await expect(contactValidation.birthDateValidator.validateAsync(testValueIn)).resolves.toEqual(testValueOut)
    })

    it('throws if given an invalid format', async () => {
      await expect(contactValidation.birthDateValidator.validateAsync(validDate.format('YYYY-MM-DDThh:mm:ss'))).rejects.toThrow(
        '"value" must be in [YYYY-MM-DD] format'
      )
    })

    it('throws if given an invalid date', async () => {
      await expect(contactValidation.birthDateValidator.validateAsync('1-111-19')).rejects.toThrow('"value" must be in [YYYY-MM-DD] format')
    })

    it("throws if given tommorow's date", async () => {
      await expect(
        contactValidation.birthDateValidator.validateAsync(
          moment()
            .add(1, 'days')
            .format('YYYY-MM-DD')
        )
      ).rejects.toThrow('"value" must be less than or equal to "now"')
    })

    it('throws if given a date of a person aged over 120', async () => {
      await expect(
        contactValidation.birthDateValidator.validateAsync(
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
      each([
        [' mIchael-hArrY ', 'Michael-Harry'],
        [' érmintrùdé ', 'Érmintrùdé']
      ]).it('converts %s to %s', async (name, expected) => {
        await expect(contactValidation.firstNameValidator.validateAsync(name)).resolves.toEqual(expected)
      })
    })

    describe('allows specific punctuation characters', () => {
      each("'-".split('')).it('allows the %s character', async c => {
        await expect(contactValidation.firstNameValidator.validateAsync(`Test${c}`)).resolves.toEqual(`Test${c}`)
      })
    })

    describe('does not allow banned characters', () => {
      each('!@£$%^&()+*/{}[];":;|\\?<>§±`~0123456789'.split('')).it('does not allow the %s character', async c => {
        await expect(contactValidation.firstNameValidator.validateAsync(c)).rejects.toThrow('contains forbidden characters')
      })
    })

    it('allows and trims forenames', async () => {
      await expect(contactValidation.firstNameValidator.validateAsync(' John ')).resolves.toEqual('John')
    })

    it('throws on empty forenames', async () => {
      await expect(contactValidation.firstNameValidator.validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the name exceeds the maximum allowed length', async () => {
      await expect(contactValidation.firstNameValidator.validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })

    it('throws where the name is a single character', async () => {
      await expect(contactValidation.firstNameValidator.validateAsync('A')).rejects.toThrow(
        '"value" length must be at least 2 characters long'
      )
    })

    it('allows a range of unicode characters from plane 1', async () => {
      const internationStr = 'ÆÇÉÑØĶŤ'
      await expect(contactValidation.firstNameValidator.validateAsync(internationStr)).resolves.toEqual('Æçéñøķť')
    })
  })

  describe('lastNameValidator', () => {
    describe('converts to title case', () => {
      each([
        [' SMITH-JONES ', 'Smith-Jones'],
        ['smith-jones', 'Smith-Jones'],
        ['smythé', 'Smythé'],
        ["O'DELL", "O'Dell"],
        ['mcdonald', 'McDonald'],
        ['macdonald', 'Macdonald'],
        ['macy', 'Macy'],
        ['van doorn', 'van Doorn'],
        ['de vries', 'de Vries'],
        ['van der waals', 'van der Waals'],
        ['van den heuvel', 'van den Heuvel']
      ]).it('converts %s to %s', async (name, expected) => {
        await expect(contactValidation.lastNameValidator.validateAsync(name)).resolves.toEqual(expected)
      })
    })

    describe('allows specific punctuation characters', () => {
      each("'-".split('')).it('allows the %s character', async c => {
        await expect(contactValidation.lastNameValidator.validateAsync(`Test${c}`)).resolves.toEqual(`Test${c}`)
      })
    })

    describe('does not allow banned characters', () => {
      each('!@£$%^&()+*/{}[];":;|\\?<>§±`~0123456789'.split('')).it('does not allow the %s character', async c => {
        await expect(contactValidation.lastNameValidator.validateAsync(c)).rejects.toThrow('contains forbidden characters')
      })
    })

    it('throws on empty last names', async () => {
      await expect(contactValidation.lastNameValidator.validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the name exceeds the maximum allowed length', async () => {
      await expect(contactValidation.lastNameValidator.validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })

    it('throws where the name is a single character', async () => {
      await expect(contactValidation.lastNameValidator.validateAsync('A')).rejects.toThrow(
        '"value" length must be at least 2 characters long'
      )
    })

    it('allows a range of unicode characters from plane 1', async () => {
      const internationStr = 'ÆÇÉÑØĶŤ'
      await expect(contactValidation.lastNameValidator.validateAsync(internationStr)).resolves.toEqual('Æçéñøķť')
    })
  })

  describe('emailValidator', () => {
    it('expects an email with 2 domain segments', async () => {
      await expect(contactValidation.emailValidator.validateAsync('person@example.com')).resolves.toEqual('person@example.com')
    })

    it('throws on a single segment', async () => {
      await expect(contactValidation.emailValidator.validateAsync('person@example')).rejects.toThrow('"value" must be a valid email')
    })
  })

  describe('mobilePhoneValidator', () => {
    each(['+44 7700 900088', '07700 900088']).it('validates %s successfully', async number => {
      await expect(contactValidation.mobilePhoneValidator.validateAsync(number)).resolves.toEqual(number)
    })

    each(['test', '07700 test']).it('rejects the invalid number %s', async number => {
      await expect(contactValidation.mobilePhoneValidator.validateAsync(number)).rejects.toThrow()
    })
  })

  describe('ukPostcodeValidator', () => {
    each([
      ['ba21nw', 'BA2 1NW'],
      [' AB12    3CD ', 'AB12 3CD'],
      ['AB123CD', 'AB12 3CD']
    ]).it('formats the UK postcode %s successfully as %s', async (postcode, replacedValue) => {
      await expect(contactValidation.ukPostcodeValidator.validateAsync(postcode)).resolves.toEqual(replacedValue)
    })
  })

  describe('premisesValidator', () => {
    it('allows and trims premises', async () => {
      await expect(contactValidation.premisesValidator.validateAsync(' 15 ROSE COTTAGE ')).resolves.toEqual('15 Rose Cottage')
    })

    it('throws on empty premises', async () => {
      await expect(contactValidation.premisesValidator.validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the premises exceeds the maximum allowed length', async () => {
      await expect(contactValidation.premisesValidator.validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })
  })

  describe('streetValidator', () => {
    it('allows and trims street', async () => {
      await expect(contactValidation.streetValidator.validateAsync(' BOND STREET ')).resolves.toEqual('Bond Street')
    })

    it('allows empty street', async () => {
      await expect(contactValidation.streetValidator.validateAsync('')).resolves.toBeFalsy()
    })

    it('throws where the street exceeds the maximum allowed length', async () => {
      await expect(contactValidation.streetValidator.validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })
  })

  describe('localityValidator', () => {
    it('allows and trims locality', async () => {
      await expect(contactValidation.localityValidator.validateAsync(' MAYFAIR ')).resolves.toEqual('Mayfair')
    })

    it('allows empty locality', async () => {
      await expect(contactValidation.localityValidator.validateAsync('')).resolves.toBeFalsy()
    })

    it('throws where the locality exceeds the maximum allowed length', async () => {
      await expect(contactValidation.localityValidator.validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })
  })

  describe('townValidator', () => {
    describe('converts to title case', () => {
      each([
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
      ]).it('converts %s to %s', async (name, expected) => {
        await expect(contactValidation.townValidator.validateAsync(name)).resolves.toEqual(expected)
      })
    })

    it('allows and trims town', async () => {
      await expect(contactValidation.townValidator.validateAsync(' LONDON ')).resolves.toEqual('London')
    })

    it('throws on empty town', async () => {
      await expect(contactValidation.townValidator.validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the town exceeds the maximum allowed length', async () => {
      await expect(contactValidation.townValidator.validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })
  })
})
