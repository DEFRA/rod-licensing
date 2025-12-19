import resultFunction from '../result-function.js'

describe('resultFunction', () => {
  const getMockRequest = journeyGoal => ({
    payload: {
      'journey-goal': journeyGoal
    }
  })
  it.each(['purchase-permission', 'renew-permission', 'cancel-recurring-payment'])(
    'returns journey goal for recognised journey goal - %s',
    async journeyGoal => {
      const mockRequest = getMockRequest(journeyGoal)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(journeyGoal)
    }
  )

  describe.each(['invalid-goal', 'unknown-journey-goal'])('handles unrecognised journey goal - %s', journeyGoal => {
    it('logs an error for unrecognised journey goal', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const mockRequest = getMockRequest(journeyGoal)
      await resultFunction(mockRequest)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown journey goal selected:', journeyGoal)
      consoleErrorSpy.mockRestore()
    })
  })
})
