import { airbrake, salesApi, DistributedLock } from '@defra-fish/connectors-lib'
import { execute } from '../notification-processor.js'
import { sendNotification, getNotificationMethod } from '../services/govuk-notify-service.js'

jest.mock('@defra-fish/business-rules-lib', () => ({
  SERVICE_LOCAL_TIME: 'Europe/London'
}))

const mockObtainAndExecute = jest.fn(async ({ onLockObtained }) => onLockObtained())
const mockRelease = jest.fn()

jest.mock('@defra-fish/connectors-lib', () => ({
  airbrake: {
    initialise: jest.fn(),
    flush: jest.fn()
  },
  salesApi: {
    getPermissionsExpiringOnDate: jest.fn(() => []),
    getPermissionsExpiredOnDate: jest.fn(() => []),
    getNotificationStatus: jest.fn(() => null),
    createNotificationStatus: jest.fn()
  },
  DistributedLock: jest.fn(() => ({
    obtainAndExecute: (...args) => mockObtainAndExecute(...args),
    release: (...args) => mockRelease(...args)
  }))
}))

jest.mock('../services/govuk-notify-service.js', () => ({
  sendNotification: jest.fn(() => 'notify-reference-123'),
  getNotificationMethod: jest.fn(() => 'email'),
  PREFERRED_METHOD_OF_REMINDER: {
    EMAIL: 910400000,
    LETTER: 910400001,
    TEXT: 910400002,
    DO_NOT_CONTACT: 910400003
  }
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))

const buildMockPermission = ({
  permissionId = 'perm-1',
  referenceNumber = 'REF-123',
  endDate = '2026-08-20T00:00:00.000Z',
  contactId = 'contact-1',
  firstName = 'John',
  lastName = 'Smith',
  email = 'john@example.com',
  mobilePhone = '07700900000',
  preferredMethodId = 910400000,
  durationMagnitude = 12
} = {}) => ({
  entity: { id: permissionId, referenceNumber, endDate },
  expanded: {
    licensee: {
      entity: {
        id: contactId,
        firstName,
        lastName,
        email,
        mobilePhone,
        preferredMethodOfReminder: { id: preferredMethodId }
      }
    },
    permit: {
      entity: { durationMagnitude }
    }
  }
})

describe('notification-processor', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockObtainAndExecute.mockImplementation(async ({ onLockObtained }) => onLockObtained())
    process.env.RUN_NOTIFICATION_JOB = 'true'
    salesApi.getPermissionsExpiringOnDate.mockResolvedValue([])
    salesApi.getPermissionsExpiredOnDate.mockResolvedValue([])
    salesApi.getNotificationStatus.mockResolvedValue(null)
    salesApi.createNotificationStatus.mockResolvedValue({})
    getNotificationMethod.mockReturnValue('email')
    sendNotification.mockResolvedValue('notify-reference-123')
  })

  afterEach(() => {
    delete process.env.RUN_NOTIFICATION_JOB
  })

  it('initialises airbrake', async () => {
    await execute()
    expect(airbrake.initialise).toHaveBeenCalled()
  })

  it('flushes airbrake on completion', async () => {
    await execute()
    expect(airbrake.flush).toHaveBeenCalled()
  })

  it('acquires a distributed lock', () => {
    jest.isolateModules(() => {
      require('../notification-processor.js')
      expect(DistributedLock).toHaveBeenCalledWith('notification-etl', 300000)
    })
  })

  it('does nothing when RUN_NOTIFICATION_JOB is not true', async () => {
    process.env.RUN_NOTIFICATION_JOB = 'false'
    await execute()
    expect(salesApi.getPermissionsExpiringOnDate).not.toHaveBeenCalled()
    expect(salesApi.getPermissionsExpiredOnDate).not.toHaveBeenCalled()
  })

  it('queries for permissions expiring in 30 days', async () => {
    await execute()
    expect(salesApi.getPermissionsExpiringOnDate).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('queries for permissions expired 1 day ago', async () => {
    await execute()
    expect(salesApi.getPermissionsExpiredOnDate).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('filters out non-12-month permits', async () => {
    const nonTwelveMonth = buildMockPermission({ durationMagnitude: 1 })
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([nonTwelveMonth])
    await execute()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it('sends notification for eligible 12-month permission', async () => {
    const permission = buildMockPermission()
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([permission])
    await execute()
    expect(sendNotification).toHaveBeenCalledWith(permission.expanded.licensee, permission, 'expiry_reminder', 'email')
  })

  it('records notification status after successful send', async () => {
    const permission = buildMockPermission()
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([permission])
    await execute()
    expect(salesApi.createNotificationStatus).toHaveBeenCalledWith({
      permissionId: 'perm-1',
      contactId: 'contact-1',
      notificationType: 'expiry_reminder',
      notifyReference: 'notify-reference-123',
      status: 'sent',
      method: 'email'
    })
  })

  it('skips contacts who prefer not to be contacted', async () => {
    const permission = buildMockPermission({ preferredMethodId: 910400003 })
    getNotificationMethod.mockReturnValueOnce(null)
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([permission])
    await execute()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it('skips permissions that already have a notification recorded', async () => {
    const permission = buildMockPermission()
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([permission])
    salesApi.getNotificationStatus.mockResolvedValueOnce({ id: 'existing-status' })
    await execute()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it('records failed status when notification fails to send', async () => {
    const permission = buildMockPermission()
    salesApi.getPermissionsExpiringOnDate.mockResolvedValue([permission])
    salesApi.getPermissionsExpiredOnDate.mockResolvedValue([])
    salesApi.getNotificationStatus.mockResolvedValue(null)
    getNotificationMethod.mockReturnValue('email')
    sendNotification.mockImplementation(() => Promise.reject(new Error('Notify API error')))
    await execute()
    expect(salesApi.createNotificationStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        permissionId: 'perm-1',
        status: 'failed'
      })
    )
  })

  it('continues processing when individual notifications fail', async () => {
    const permission1 = buildMockPermission({ permissionId: 'perm-1', contactId: 'contact-1' })
    const permission2 = buildMockPermission({ permissionId: 'perm-2', contactId: 'contact-2' })
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([permission1, permission2])
    sendNotification.mockRejectedValueOnce(new Error('Notify API error'))
    sendNotification.mockResolvedValueOnce('notify-ref-2')
    await execute()
    expect(salesApi.createNotificationStatus).toHaveBeenCalledTimes(2)
  })

  it('skips contacts without email when method is email', async () => {
    const permission = buildMockPermission({ email: '' })
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([permission])
    await execute()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it('skips contacts without phone when method is sms', async () => {
    const permission = buildMockPermission({ mobilePhone: '' })
    getNotificationMethod.mockReturnValueOnce('sms')
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([permission])
    await execute()
    expect(sendNotification).not.toHaveBeenCalled()
  })

  it('processes both expiry reminders and expired notices', async () => {
    const expiringPermission = buildMockPermission({ permissionId: 'expiring-1' })
    const expiredPermission = buildMockPermission({ permissionId: 'expired-1' })
    salesApi.getPermissionsExpiringOnDate.mockResolvedValueOnce([expiringPermission])
    salesApi.getPermissionsExpiredOnDate.mockResolvedValueOnce([expiredPermission])
    await execute()
    expect(sendNotification).toHaveBeenCalledTimes(2)
    expect(sendNotification).toHaveBeenCalledWith(expect.anything(), expiringPermission, 'expiry_reminder', 'email')
    expect(sendNotification).toHaveBeenCalledWith(expect.anything(), expiredPermission, 'expired_notice', 'email')
  })

  describe('signal handling', () => {
    it('registers SIGINT handler', () => {
      const listeners = process.listeners('SIGINT')
      expect(listeners.length).toBeGreaterThan(0)
    })

    it('registers SIGTERM handler', () => {
      const listeners = process.listeners('SIGTERM')
      expect(listeners.length).toBeGreaterThan(0)
    })
  })
})
