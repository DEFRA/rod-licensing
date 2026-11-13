import updateTransaction from '../update-transaction'

describe('has-licence > update-transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('default', () => {
    it('does not throw an exception when called', async () => {
      await expect(
        updateTransaction({})
      ).resolves.not.toThrowError();
    })
  })
})
