import Joi from 'joi'
import * as contactValidation from '../contact.validators.js'
import moment from 'moment'

const INVALID_DATE_ERROR_MESSAGE = '"value" must be in [YYYY-MM-DD] format'

describe('contact validators', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
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

    it.each([
      'M̵i̵c̵h̵a̵e̵l̵',
      'M̷i̷c̷h̷a̷e̷l̷',
      'M͟i͟c͟h͟a͟e͟l͟',
      '𝔐𝔦𝔠𝔥𝔞𝔢𝔩',
      '𝕄𝕚𝕔𝕙𝕒𝕖𝕝',
      'ןǝɐɥɔıW',
      'Ⓜⓘⓒⓗⓐⓔⓛ',
      '🄼🄸🄲🄷🄰🄴🄻',
      'Mɪᴄʜᴀᴇʟ',
      'ᴹᶦᶜʰᵃᵉˡ',
      '𖢑𖥣𖥐𖦙𖧥𖠢ꛚ',
      'ℳ𝒾𝒸𝒽𝒶ℯ𝓁',
      '𝙼𝚒𝚌𝚑𝚊𝚎𝚕'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createFirstNameValidator(Joi).validateAsync(c)).rejects.toThrow()
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

    it.each([
      'M̵i̵c̵h̵a̵e̵l̵',
      'M̷i̷c̷h̷a̷e̷l̷',
      'M͟i͟c͟h͟a͟e͟l͟',
      '𝔐𝔦𝔠𝔥𝔞𝔢𝔩',
      '𝕄𝕚𝕔𝕙𝕒𝕖𝕝',
      'ןǝɐɥɔıW',
      'Ⓜⓘⓒⓗⓐⓔⓛ',
      '🄼🄸🄲🄷🄰🄴🄻',
      'Mɪᴄʜᴀᴇʟ',
      'ᴹᶦᶜʰᵃᵉˡ',
      '𖢑𖥣𖥐𖦙𖧥𖠢ꛚ',
      'ℳ𝒾𝒸𝒽𝒶ℯ𝓁',
      '𝙼𝚒𝚌𝚑𝚊𝚎𝚕'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createLastNameValidator(Joi).validateAsync(c)).rejects.toThrow()
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

    it('allows a range of unicode characters from plane 1', async () => {
      const internationStr = 'æçéñøķť@email.com'
      await expect(contactValidation.createEmailValidator(Joi).validateAsync(internationStr)).resolves.toEqual('æçéñøķť@email.com')
    })

    it.each([
      'ᵐᵢᶜₕᵃₑˡ@ᵉₘᵃᵢˡ.ᶜₒᵐ',
      '𝓂𝒾𝒸𝒽𝒶ℯ𝓁@ℯ𝓂𝒶𝒾𝓁.𝒸ℴ𝓂',
      'm̶i̶c̶h̶a̶e̶l̶@̶e̶m̶a̶i̶l̶.̶c̶o̶m̶',
      'm̷i̷c̷h̷a̷e̷l̷@̷e̷m̷a̷i̷l̷.̷c̷o̷m̷',
      '𝖒𝖎𝖈𝖍𝖆𝖊𝖑@𝖊𝖒𝖆𝖎𝖑.𝖈𝖔𝖒',
      'm̲i̲c̲h̲a̲e̲l̲@̲e̲m̲a̲i̲l̲.̲c̲o̲m̲',
      'ꕮꕯꖀꖾꗇꗍꝆ@ꗍꕮꗇꕯꝆ.ꖀꗞꕮ',
      '🅼🅘🅲🅗🅰🅔🅻@🅴🅜🅰🅘🅻.🅲🅞🅼',
      'ɯoɔ˙ןıɐɯǝ@ןǝɐɥɔıɯ',
      'ꮇꮖꮯꮋꭺꭼꮮ@ꭼꮇꭺꮖꮮ.ꮯꮎꮇ',
      'ｍｉｃｈａｅｌ＠ｅｍａｉｌ．ｃｏｍ',
      'ₘᵢcₕaₑₗ@ₑₘaᵢₗ.cₒₘ'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createEmailValidator(Joi).validateAsync(c)).rejects.toThrow()
    })
  })

  describe('mobilePhoneValidator', () => {
    it.each(['+44 7700 900088', '07700 900088'])('validates %s successfully', async number => {
      await expect(contactValidation.createMobilePhoneValidator(Joi).validateAsync(number)).resolves.toEqual(number)
    })

    it.each(['test', '07700 test'])('rejects the invalid number %s', async number => {
      await expect(contactValidation.createMobilePhoneValidator(Joi).validateAsync(number)).rejects.toThrow()
    })

    it.each([
      '𝟘𝟟𝟟𝟘𝟘 𝟡𝟘𝟘𝟘𝟠𝟠',
      '0𝟟7𝟘0 9𝟘0𝟘8𝟠',
      '0𝟽𝟽00 𝟿000𝟾𝟾',
      '0̵7̵7̵0̵0̵ ̵9̵0̵0̵0̵8̵8̵',
      '0͟7͟7͟0͟0͟ ͟9͟0͟0͟0͟8͟8͟',
      '0̸7̸7̸0̸0̸ ̸9̸0̸0̸0̸8̸8̸',
      '０７７００ ９０００８８',
      '⁰⁷⁷⁰⁰ ⁹⁰⁰⁰⁸⁸',
      '⓿➐➐⓿⓿ ➒⓿⓿⓿➑➑',
      '+ㄐㄐワワㄖㄖ ㄢㄖㄖㄖ曰曰',
      '07700👏 900088',
      '0̐̈7̐̈7̐̈0̐̈0̐̈ ̐̈9̐̈0̐̈0̐̈0̐̈8̐̈8̐̈',
      '+4④7⑦0⓪ ⑨0⓪0⑧8'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createMobilePhoneValidator(Joi).validateAsync(c)).rejects.toThrow()
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

    it.each([
      'A⃣B⃣1⃣2⃣ 1⃣A⃣B⃣',
      '🄐🄑⑴⑵ ⑴🄐🄑',
      '丹乃丨己 丨丹乃',
      'A͢B͢1͢2͢ ͢1͢A͢B͢',
      'A⃟B⃟1⃟2⃟ 1⃟A⃟B⃟',
      'AB12👏 1AB',
      '🅐Ⓑ➊② ①🅐Ⓑ',
      '𝘼𝐵𝟭𝟮 1𝘼𝘽',
      '🅰𝙱12 1𝕬𝓑',
      '1ᴬAᴮB¹²',
      'ᴬᴮ¹² ¹ᴬᴮ',
      'q∀1 21q∀',
      'A̶B̶1̶2̶ ̶1̶A̶B̶'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createUKPostcodeValidator(Joi).validateAsync(c)).rejects.toThrow()
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

    it.each([
      'A⃣B⃣1⃣2⃣ 1⃣A⃣B⃣',
      '🄐🄑⑴⑵ ⑴🄐🄑',
      '丹乃丨己 丨丹乃',
      'A͢B͢1͢2͢ ͢1͢A͢B͢',
      'A⃟B⃟1⃟2⃟ 1⃟A⃟B⃟',
      'AB12👏 1AB',
      '🅐Ⓑ➊② ①🅐Ⓑ',
      '𝘼𝐵𝟭𝟮 1𝘼𝘽',
      '🅰𝙱12 1𝕬𝓑',
      '1ᴬAᴮB¹²',
      'ᴬᴮ¹² ¹ᴬᴮ',
      'q∀1 21q∀',
      'A̶B̶1̶2̶ ̶1̶A̶B̶'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createOverseasPostcodeValidator(Joi).validateAsync(c)).rejects.toThrow()
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

    it.each([
      '15 𐝥ꗞꕷꗍ ꖀꗞꖡꖡꗇꗱꗍ',
      '１５ Ｒｏｓｅ Ｃｏｔｔａｇｅ',
      '¹⁵ ᴿᵒˢᵉ ᶜᵒᵗᵗᵃᵍᵉ',
      '15 ᖇᐤᔆᕪ ᐸᐤᐩᐩᐞᕐᕪ',
      '15👏 Rose👏 Cottage',
      '1̶5̶ ̶R̶o̶s̶e̶ ̶C̶o̶t̶t̶a̶g̶e̶',
      '1̲5̲ ̲R̲o̲s̲e̲ ̲C̲o̲t̲t̲a̲g̲e̲',
      '1̸5̸ ̸R̸o̸s̸e̸ ̸C̸o̸t̸t̸a̸g̸e̸',
      '➊➎ 🅡🅞🅢🅔 🅒🅞🅣🅣🅐🅖🅔',
      '①➎ 🅡ⓞ🅢ⓔ Ⓒ🅞ⓣ🅣ⓐ🅖ⓔ',
      '1⑤ 𝑅𝐨𝑠ⓔ 𝒞𝓸𝘁𝕥𝒶ℊ🄴',
      '𝟏𝟓 𝐑𝐨𝐬𝐞 𝐂𝐨𝐭𝐭𝐚𝐠𝐞'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createPremisesValidator(Joi).validateAsync(c)).rejects.toThrow()
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

    it.each([
      'Bond👏 Street',
      '🅑ⓞ🅝ⓓ ⓢⓣⓡⓔⓔⓣ',
      'Ｂｏｎｄ Ｓｔｒｅｅｔ',
      'ᴮᵒⁿᵈ ˢᵗʳᵉᵉᵗ',
      'B̲o̲n̲d̲ ̲S̲t̲r̲e̲e̲t̲',
      'B̸o̸n̸d̸ ̸S̸t̸r̸e̸e̸t̸',
      '🅑🅞🅝🅓 🅢🅣🅡🅔🅔🅣',
      'B𝑜𝓷d S𝓉𝓇𝑒𝑒𝓉',
      'もＢ囗ｏ几ｎ问ｄ  丂Ｓ匕ｔ尺ｒ乇ｅモｅ匕ｔ',
      'B⃠o⃠n⃠d⃠ S⃠t⃠r⃠e⃠e⃠t⃠',
      '𝐁𝐨𝐧𝐝 𝐒𝐭𝐫𝐞𝐞𝐭'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createStreetValidator(Joi).validateAsync(c)).rejects.toThrow()
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

    it.each([
      'M̲a̲y̲f̲a̲i̲r̲',
      'M̸a̸y̸f̸a̸i̸r̸',
      'Ｍａｙｆａｉｒ',
      'ᴹᵃʸᶠᵃⁱʳ',
      '🅜🅐🅨🅕🅐🅘🅡',
      '🅜ⓐ🅨ⓕⓐⓘⓡ',
      '爪Ｍ丹ａﾘｙ乍ｆ丹ａ工ｉ尺ｒ',
      'M⃠a⃠y⃠f⃠a⃠i⃠r⃠',
      '𝐌𝐚𝐲𝐟𝐚𝐢𝐫'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createLocalityValidator(Joi).validateAsync(c)).rejects.toThrow()
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

    it.each(['Ｌｏｎｄｏｎ', 'ᴸᵒⁿᵈᵒⁿ', '𝐋𝐨𝐧𝐝𝐨𝐧', 'ㄥＬ口ｏ几ｎ冂ｄ口ｏ几ｎ', 'L⃠o⃠n⃠d⃠o⃠n⃠', '🅛🅞🅝🅓🅞🅝', 'L̸o̸n̸d̸o̸n̸', 'L̲o̲n̲d̲o̲n̲'])(
      'prohibits a string with non-standard characters: %s',
      async c => {
        await expect(contactValidation.createTownValidator(Joi).validateAsync(c)).rejects.toThrow()
      }
    )
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

    it.each([
      'A̲B̲1̲2̲3̲4̲5̲6̲A̲',
      'A̸B̸1̸2̸3̸4̸5̸6̸A̸',
      'ＡＢ１２３４５６Ａ',
      'ᴬᴮ¹²³⁴⁵⁶ᴬ',
      '🅐🅑①②③④⑤⑥🅐',
      '🅐ⓑ①②③④⑤⑥ⓐ',
      'A⃠B⃠1⃠2⃠3⃠4⃠5⃠6⃠A⃠',
      '升Ａ马Ｂ丨１己２ヨ３ㄐ４丂５石６刄Ａ',
      '✌️AB123456A✌️',
      '𝐀𝐁𝟏𝟐𝟑𝟒𝟓𝟔𝐀'
    ])('prohibits a string with non-standard characters: %s', async c => {
      await expect(contactValidation.createNationalInsuranceNumberValidator(Joi).validateAsync(c)).rejects.toThrow()
    })
  })
})
