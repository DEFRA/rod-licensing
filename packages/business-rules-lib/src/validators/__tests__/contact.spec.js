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

    it("throws if given tommorows's date", async () => {
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
    it('allows and trims premises', async () => {
      await expect(contactValidation.firstNameValidator.validateAsync(' John ')).resolves.toEqual('JOHN')
    })

    it('throws on empty premises', async () => {
      await expect(contactValidation.firstNameValidator.validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the name is over 100 characters', async () => {
      await expect(contactValidation.firstNameValidator.validateAsync('A'.repeat(101))).rejects.toThrow(
        '"value" length must be less than or equal to 100 characters long'
      )
    })

    it('throws where the name a single character', async () => {
      await expect(contactValidation.firstNameValidator.validateAsync('A')).rejects.toThrow(
        '"value" length must be at least 2 characters long'
      )
    })

    it('It allows a range of unicode characters from plane 1', async () => {
      const internationStr = 'Æçéñøķť'
      await expect(contactValidation.firstNameValidator.validateAsync(internationStr)).resolves.toEqual('ÆÇÉÑØĶŤ')
    })

    it('It does not allow numbers', async () => {
      const nbrStr = '123'
      await expect(contactValidation.firstNameValidator.validateAsync(nbrStr)).rejects.toThrow('contains forbidden characters')
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
      await expect(contactValidation.premisesValidator.validateAsync(' 15 Rose Cottage ')).resolves.toEqual('15 ROSE COTTAGE')
    })

    it('throws on empty premises', async () => {
      await expect(contactValidation.premisesValidator.validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the premises is over 50 characters', async () => {
      await expect(contactValidation.premisesValidator.validateAsync('A'.repeat(51))).rejects.toThrow(
        '"value" length must be less than or equal to 50 characters long'
      )
    })
  })

  describe('streetValidator', () => {
    it('allows and trims street', async () => {
      await expect(contactValidation.streetValidator.validateAsync(' Bond Street ')).resolves.toEqual('BOND STREET')
    })

    it('allows empty street', async () => {
      await expect(contactValidation.streetValidator.validateAsync('')).resolves.toBeFalsy()
    })

    it('throws where the street is over 50 characters', async () => {
      await expect(contactValidation.streetValidator.validateAsync('A'.repeat(51))).rejects.toThrow(
        '"value" length must be less than or equal to 50 characters long'
      )
    })
  })

  describe('localityValidator', () => {
    it('allows and trims locality', async () => {
      await expect(contactValidation.localityValidator.validateAsync(' Mayfair ')).resolves.toEqual('MAYFAIR')
    })

    it('allows empty locality', async () => {
      await expect(contactValidation.localityValidator.validateAsync('')).resolves.toBeFalsy()
    })

    it('throws where the locality is over 50 characters', async () => {
      await expect(contactValidation.localityValidator.validateAsync('A'.repeat(51))).rejects.toThrow(
        '"value" length must be less than or equal to 50 characters long'
      )
    })
  })

  describe('townValidator', () => {
    it('allows and trims town', async () => {
      await expect(contactValidation.townValidator.validateAsync(' london ')).resolves.toEqual('LONDON')
    })

    it('throws on empty town', async () => {
      await expect(contactValidation.townValidator.validateAsync('')).rejects.toThrow('"value" is not allowed to be empty')
    })

    it('throws where the town is over 50 characters', async () => {
      await expect(contactValidation.townValidator.validateAsync('A'.repeat(51))).rejects.toThrow(
        '"value" length must be less than or equal to 50 characters long'
      )
    })
  })
})
