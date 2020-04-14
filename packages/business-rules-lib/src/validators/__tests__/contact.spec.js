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

  describe('postcodeValidator', () => {
    each([
      ['ba21nw', 'BA2 1NW'],
      ['A B 1 2 3 C D', 'AB12 3CD'],
      ['AB123CD', 'AB12 3CD']
    ]).it('formats the UK postcode %s successfully as %s', async (postcode, replacedValue) => {
      await expect(contactValidation.postcodeValidator.validateAsync(postcode)).resolves.toEqual(replacedValue)
    })

    each(['34928347', '344-333-202', 'NOT-A-RECOGNISED-POSTCODE']).it('allows the non-UK %s postcode', async postcode => {
      await expect(contactValidation.postcodeValidator.validateAsync(postcode)).resolves.toEqual(postcode)
    })
  })
})
