import { govUkNotifyApi } from '@defra-fish/connectors-lib'
import { sendNotification, getNotificationMethod, NOTIFICATION_METHOD, PREFERRED_METHOD_OF_REMINDER } from '../govuk-notify-service.js'

jest.mock('@defra-fish/connectors-lib', () => ({
  govUkNotifyApi: {
    sendEmail: jest.fn(() => ({ data: { id: 'email-notify-id' } })),
    sendSms: jest.fn(() => ({ data: { id: 'sms-notify-id' } })),
    sendLetter: jest.fn(() => ({ data: { id: 'letter-notify-id' } }))
  }
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))

const mockContact = {
  entity: {
    id: 'contact-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
    mobilePhone: '07700900000',
    premises: '10 Downing Street',
    street: '',
    locality: 'Westminster',
    town: 'London',
    postcode: 'SW1A 2AA'
  }
}

const mockPermission = {
  entity: {
    id: 'permission-1',
    referenceNumber: 'REF-12345678',
    endDate: '2026-08-20T00:00:00.000Z'
  }
}

describe('govuk-notify-service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOV_NOTIFY_EXPIRY_REMINDER_EMAIL_TEMPLATE_ID = 'email-template-reminder'
    process.env.GOV_NOTIFY_EXPIRED_NOTICE_EMAIL_TEMPLATE_ID = 'email-template-expired'
    process.env.GOV_NOTIFY_EXPIRY_REMINDER_SMS_TEMPLATE_ID = 'sms-template-reminder'
    process.env.GOV_NOTIFY_EXPIRED_NOTICE_SMS_TEMPLATE_ID = 'sms-template-expired'
    process.env.GOV_NOTIFY_EXPIRY_REMINDER_LETTER_TEMPLATE_ID = 'letter-template-reminder'
    process.env.GOV_NOTIFY_EXPIRED_NOTICE_LETTER_TEMPLATE_ID = 'letter-template-expired'
  })

  describe('sendNotification', () => {
    it('sends email notification for expiry reminder', async () => {
      const result = await sendNotification(mockContact, mockPermission, 'expiry_reminder', NOTIFICATION_METHOD.EMAIL)
      expect(govUkNotifyApi.sendEmail).toHaveBeenCalledWith(
        'email-template-reminder',
        'john@example.com',
        expect.objectContaining({
          personalisation: expect.objectContaining({
            first_name: 'John',
            last_name: 'Smith',
            licence_number: 'REF-12345678'
          }),
          reference: 'permission-1-expiry_reminder'
        })
      )
      expect(result).toBe('email-notify-id')
    })

    it('sends email notification for expired notice', async () => {
      const result = await sendNotification(mockContact, mockPermission, 'expired_notice', NOTIFICATION_METHOD.EMAIL)
      expect(govUkNotifyApi.sendEmail).toHaveBeenCalledWith('email-template-expired', 'john@example.com', expect.anything())
      expect(result).toBe('email-notify-id')
    })

    it('sends SMS notification', async () => {
      const result = await sendNotification(mockContact, mockPermission, 'expiry_reminder', NOTIFICATION_METHOD.SMS)
      expect(govUkNotifyApi.sendSms).toHaveBeenCalledWith(
        'sms-template-reminder',
        '07700900000',
        expect.objectContaining({
          personalisation: expect.objectContaining({
            first_name: 'John'
          }),
          reference: 'permission-1-expiry_reminder'
        })
      )
      expect(result).toBe('sms-notify-id')
    })

    it('sends letter notification with address fields', async () => {
      const result = await sendNotification(mockContact, mockPermission, 'expiry_reminder', NOTIFICATION_METHOD.LETTER)
      expect(govUkNotifyApi.sendLetter).toHaveBeenCalledWith(
        'letter-template-reminder',
        expect.objectContaining({
          personalisation: expect.objectContaining({
            address_line_1: 'John Smith',
            address_line_2: '10 Downing Street',
            address_line_6: 'SW1A 2AA'
          }),
          reference: 'permission-1-expiry_reminder'
        })
      )
      expect(result).toBe('letter-notify-id')
    })

    it('throws error for unsupported notification method', async () => {
      await expect(sendNotification(mockContact, mockPermission, 'expiry_reminder', 'pigeon')).rejects.toThrow(
        'Unsupported notification method: pigeon'
      )
    })

    it('includes formatted expiry date in personalisation', async () => {
      await sendNotification(mockContact, mockPermission, 'expiry_reminder', NOTIFICATION_METHOD.EMAIL)
      expect(govUkNotifyApi.sendEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          personalisation: expect.objectContaining({
            expiry_date: '20 August 2026'
          })
        })
      )
    })
  })

  describe('getNotificationMethod', () => {
    it('returns email for EMAIL preference', () => {
      expect(getNotificationMethod({ id: PREFERRED_METHOD_OF_REMINDER.EMAIL })).toBe('email')
    })

    it('returns sms for TEXT preference', () => {
      expect(getNotificationMethod({ id: PREFERRED_METHOD_OF_REMINDER.TEXT })).toBe('sms')
    })

    it('returns letter for LETTER preference', () => {
      expect(getNotificationMethod({ id: PREFERRED_METHOD_OF_REMINDER.LETTER })).toBe('letter')
    })

    it('returns null for DO_NOT_CONTACT preference', () => {
      expect(getNotificationMethod({ id: PREFERRED_METHOD_OF_REMINDER.DO_NOT_CONTACT })).toBeNull()
    })

    it('returns null for undefined preference', () => {
      expect(getNotificationMethod(undefined)).toBeNull()
    })
  })
})
