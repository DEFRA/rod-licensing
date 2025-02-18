import recurringPayments from '../recurring-payments.js'
import {
  generateRecurringPaymentRecord,
  getRecurringPayments,
  processRecurringPayment
} from '../../../services/recurring-payments.service.js'
import { createRecurringPaymentPermission } from '../../../services/permissions.service.js'

const [
  {
    options: { handler: drpHandler }
  },
  {
    options: { handler: generateHandler }
  },
  {
    options: { handler: processHandler }
  },
  {
    options: { handler: createPermissionHandler }
  }
] = recurringPayments

jest.mock('../../../services/recurring-payments.service.js', () => ({
  getRecurringPayments: jest.fn(),
  generateRecurringPaymentRecord: jest.fn(),
  processRecurringPayment: jest.fn()
}))

jest.mock('../../../services/permissions.service.js', () => ({
  createRecurringPaymentPermission: jest.fn()
}))

const getMockRequest = ({ params = {}, payload = {} } = {}) => ({
  params,
  payload
})

const getMockResponseToolkit = () => ({
  response: jest.fn()
})

describe('recurring payments', () => {
  beforeEach(jest.clearAllMocks)

  describe('dueRecurringPayments', () => {
    it('handler should return continue response', async () => {
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()
      expect(await drpHandler(request, responseToolkit)).toEqual(responseToolkit.continue)
    })

    it('should call getRecurringPayments with date', async () => {
      const date = Symbol('date')
      const request = getMockRequest({ params: { date } })
      await drpHandler(request, getMockResponseToolkit())
      expect(getRecurringPayments).toHaveBeenCalledWith(date)
    })
  })

  describe('generateRecurringPaymentRecord', () => {
    it('handler should return continue response', async () => {
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()
      expect(await generateHandler(request, responseToolkit)).toEqual(responseToolkit.continue)
    })

    it('should call generateRecurringPaymentRecord with correct params', async () => {
      const transactionRecord = Symbol('transactionRecord')
      const permission = Symbol('permission')
      const request = getMockRequest({ params: { transactionRecord, permission } })
      const responseToolkit = getMockResponseToolkit()

      await generateHandler(request, responseToolkit)

      expect(generateRecurringPaymentRecord).toHaveBeenCalledWith(transactionRecord, permission)
    })
  })

  describe('processRecurringPayment', () => {
    it('handler should return continue response', async () => {
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()
      expect(await processHandler(request, responseToolkit)).toEqual(responseToolkit.continue)
    })

    it('should call processRecurringPayment with correct params', async () => {
      const transactionRecord = Symbol('transactionRecord')
      const contact = Symbol('contact')
      const request = getMockRequest({ params: { transactionRecord, contact } })
      const responseToolkit = getMockResponseToolkit()

      processRecurringPayment.mockResolvedValue({ success: true })

      await processHandler(request, responseToolkit)

      expect(processRecurringPayment).toHaveBeenCalledWith(transactionRecord, contact)
    })
  })

  describe('createRecurringPaymentPermission', () => {
    it('handler should return continue response', async () => {
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()
      expect(await createPermissionHandler(request, responseToolkit)).toEqual(responseToolkit.continue)
    })

    it('should call createRecurringPaymentPermission with correct payload', async () => {
      const permissionData = {
        referenceNumber: '789XYZ',
        issueDate: '2025-02-17T08:55:45.524Z',
        startDate: '2025-02-17T08:55:45.524Z',
        endDate: '2026-02-17T08:55:45.524Z',
        dataSource: 'Web',
        isRenewal: false,
        licensee: { firstName: 'John', lastName: 'Doe', birthDate: '1990-01-01' },
        permitId: 'some-permit-id'
      }

      const request = getMockRequest({ payload: permissionData })
      const responseToolkit = getMockResponseToolkit()

      createRecurringPaymentPermission.mockResolvedValue({ success: true })

      await createPermissionHandler(request, responseToolkit)

      expect(createRecurringPaymentPermission).toHaveBeenCalledWith(permissionData)
    })
  })
})
