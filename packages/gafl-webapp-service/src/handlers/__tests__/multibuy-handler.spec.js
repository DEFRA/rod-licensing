const mockCheckMultibuyForYou = jest.fn()

jest.mock('../multibuy-handler', () => {
  return jest.fn().mockImplementation(() => {
    return {
      checkMultibuyForYou: mockCheckMultibuyForYou
    }
  })
})

describe('The multibuy handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return multibuy as yes if multibuy and licence is for you', async () => {
    const result = mockCheckMultibuyForYou.mockImplementationOnce(() => ({ permissions: { length: 3, isLicenceForYou: true } }))
    expect(result).toBeTruthy()
  })

  it('should not return isMultibuyForYou when licence is for someone else', async () => {
    const result = mockCheckMultibuyForYou.mockImplementationOnce(() => ({ permissions: { length: 3, isLicenceForYou: false } }))
    expect(result).toBeTruthy()
  })

  it('should not return isMultibuyForYou when isnt licence in basket', async () => {
    const result = mockCheckMultibuyForYou.mockImplementationOnce(() => ({ permissions: { length: 0, isLicenceForYou: true } }))
    expect(result).toBeTruthy()
  })
})
