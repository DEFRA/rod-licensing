import { isMultibuyForYou } from '../multibuy-for-you-handler'

describe('The multibuy handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([[3], [4], [5]])('should return multibuy as yes if multibuy and licence is for you', async length => {
    const transaction = {
      permissions: {
        length: length,
        isLicenceForYou: true
      }
    }
    const result = await isMultibuyForYou(generateRequestMock(transaction))
    expect(result).toBeTruthy()
  })

  it('should not return isMultibuyForYou when licence is for someone else', async () => {
    const transaction = {
      permissions: {
        length: 2,
        isLicenceForYou: false
      }
    }
    const result = await isMultibuyForYou(generateRequestMock(transaction))
    expect(result).not.toBeTruthy()
  })

  it('should not return isMultibuyForYou when isnt licence in basket', async () => {
    const transaction = {
      permissions: {
        length: 0,
        isLicenceForYou: true
      }
    }
    const result = await isMultibuyForYou(generateRequestMock(transaction))
    expect(result).not.toBeTruthy()
  })

  const generateRequestMock = (transaction = {}) => ({
    cache: jest.fn(() => ({
      helpers: {
        transaction: {
          get: jest.fn(() => transaction),
          set: jest.fn()
        }
      }
    }))
  })
})
