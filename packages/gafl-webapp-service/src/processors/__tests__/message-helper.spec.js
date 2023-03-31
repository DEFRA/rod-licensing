import { youOrOther } from '../message-helper.js'

describe('youOrOther', () => {
  it.each([
    ['you', true],
    ['other', false]
  ])('returns %s when isLicenceForYou is set to %s', async (expectedValue, isLicenceForYou) => {
    const permission = { isLicenceForYou }
    expect(youOrOther(permission)).toEqual(expectedValue)
  })
})
