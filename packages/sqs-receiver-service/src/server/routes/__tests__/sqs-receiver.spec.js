import sqsReceiver from '../sqs-receiver.js'
import receiver from '../../../receiver.js'

const [
  {
    options: { handler: receiverHandler }
  }
] = sqsReceiver

jest.mock('../../../receiver.js', () => ({
  receiver: jest.fn()
}))

describe('sqs receiver', () => {
  beforeEach(jest.clearAllMocks)

  describe('receiver', () => {
    it('should call receiver', async () => {
      await receiverHandler()
      expect(receiver).toHaveBeenCalled()
    })
  })
})
