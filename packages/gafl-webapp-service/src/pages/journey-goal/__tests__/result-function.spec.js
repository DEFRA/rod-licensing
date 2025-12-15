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
    it('returns PURCHASE_PERMISSION for unrecognised journey goal', async () => {
      const mockRequest = getMockRequest(journeyGoal)
      const result = await resultFunction(mockRequest)
      expect(result).toBe('purchase-permission')
    })

    it('logs a warning for unrecognised journey goal', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn')
      const mockRequest = getMockRequest(journeyGoal)
      await resultFunction(mockRequest)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown journey goal selected:', journeyGoal)
      consoleWarnSpy.mockRestore()
    })
  })
})
