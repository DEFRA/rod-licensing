import { sendEmail, sendSms, sendLetter, getNotificationById } from '../govuk-notify-api.js'

const mockSendEmail = jest.fn()
const mockSendSms = jest.fn()
const mockSendLetter = jest.fn()
const mockGetNotificationById = jest.fn()

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => ({
    sendEmail: mockSendEmail,
    sendSms: mockSendSms,
    sendLetter: mockSendLetter,
    getNotificationById: mockGetNotificationById
  }))
}))

describe('govuk-notify-api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOV_NOTIFY_API_KEY = 'test-api-key'
  })

  describe('sendEmail', () => {
    it('sends an email using the Notify client', async () => {
      const mockResponse = { data: { id: 'notify-id-1' } }
      mockSendEmail.mockResolvedValue(mockResponse)

      const result = await sendEmail('template-1', 'test@example.com', { personalisation: { name: 'Test' } })

      expect(mockSendEmail).toHaveBeenCalledWith('template-1', 'test@example.com', { personalisation: { name: 'Test' } })
      expect(result).toEqual(mockResponse)
    })

    it('throws and logs error on failure', async () => {
      const error = new Error('API error')
      mockSendEmail.mockRejectedValue(error)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await expect(sendEmail('template-1', 'test@example.com')).rejects.toThrow('API error')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error sending email via GOV.UK Notify'), error)
      consoleSpy.mockRestore()
    })
  })

  describe('sendSms', () => {
    it('sends an SMS using the Notify client', async () => {
      const mockResponse = { data: { id: 'notify-id-2' } }
      mockSendSms.mockResolvedValue(mockResponse)

      const result = await sendSms('template-2', '07700900000', { personalisation: { name: 'Test' } })

      expect(mockSendSms).toHaveBeenCalledWith('template-2', '07700900000', { personalisation: { name: 'Test' } })
      expect(result).toEqual(mockResponse)
    })

    it('throws and logs error on failure', async () => {
      const error = new Error('SMS error')
      mockSendSms.mockRejectedValue(error)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await expect(sendSms('template-2', '07700900000')).rejects.toThrow('SMS error')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error sending SMS via GOV.UK Notify'), error)
      consoleSpy.mockRestore()
    })
  })

  describe('sendLetter', () => {
    it('sends a letter using the Notify client', async () => {
      const mockResponse = { data: { id: 'notify-id-3' } }
      mockSendLetter.mockResolvedValue(mockResponse)

      const options = { personalisation: { address_line_1: 'Test' } }
      const result = await sendLetter('template-3', options)

      expect(mockSendLetter).toHaveBeenCalledWith('template-3', options)
      expect(result).toEqual(mockResponse)
    })

    it('throws and logs error on failure', async () => {
      const error = new Error('Letter error')
      mockSendLetter.mockRejectedValue(error)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await expect(sendLetter('template-3')).rejects.toThrow('Letter error')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error sending letter via GOV.UK Notify'), error)
      consoleSpy.mockRestore()
    })
  })

  describe('getNotificationById', () => {
    it('retrieves notification status from Notify', async () => {
      const mockResponse = { data: { id: 'notify-id-1', status: 'delivered' } }
      mockGetNotificationById.mockResolvedValue(mockResponse)

      const result = await getNotificationById('notify-id-1')

      expect(mockGetNotificationById).toHaveBeenCalledWith('notify-id-1')
      expect(result).toEqual(mockResponse)
    })

    it('throws and logs error on failure', async () => {
      const error = new Error('Not found')
      mockGetNotificationById.mockRejectedValue(error)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await expect(getNotificationById('bad-id')).rejects.toThrow('Not found')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error retrieving notification status from GOV.UK Notify'), error)
      consoleSpy.mockRestore()
    })
  })
})
