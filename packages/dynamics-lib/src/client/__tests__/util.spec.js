import { escapeODataStringValue, generateDobId, getRandomInt } from '../util.js'

describe('util', () => {
  describe('escapeODataStringValue', () => {
    it('escapes all illegal characters used in a string value of an ODATA $filter clause', async () => {
      expect(escapeODataStringValue("test%+/?#&'test%+/?#&'test")).toEqual("test%25%2B%2F%3F%23%26''test%25%2B%2F%3F%23%26''test")
    })
  })

  describe('generateDobId', () => {
    it('generates string that contains the date of birth padded by 2 random numbers at the start and 4 random numbers at the end', () => {
      const obfuscatedDob = generateDobId('2000-01-01')
      expect(obfuscatedDob.substring(2, 10)).toBe('20000101')

      const obfuscatedDobFirstPart = parseInt(obfuscatedDob.substring(0, 2))
      expect(obfuscatedDobFirstPart).toBeGreaterThanOrEqual(10)
      expect(obfuscatedDobFirstPart).toBeLessThanOrEqual(99)

      const obfuscatedDobSecondPart = parseInt(obfuscatedDob.substring(10, 14))
      expect(obfuscatedDobSecondPart).toBeGreaterThanOrEqual(1000)
      expect(obfuscatedDobSecondPart).toBeLessThanOrEqual(9999)
    })
  })

  describe('getRandomInt', () => {
    it('gets a random integer between a range', () => {
      const randomInt = getRandomInt(10, 99)
      expect(randomInt).toBeGreaterThanOrEqual(10)
      expect(randomInt).toBeLessThanOrEqual(99)
    })

    it('gets a random integer between a negative range', () => {
      const randomInt = getRandomInt(-10, 10)
      expect(randomInt).toBeGreaterThanOrEqual(-10)
      expect(randomInt).toBeLessThanOrEqual(10)
    })
  })
})
