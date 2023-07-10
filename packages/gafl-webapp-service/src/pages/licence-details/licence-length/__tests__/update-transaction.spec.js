import updateTransaction from '../update-transaction'
import { LICENCE_FULFILMENT } from '../../../../uri.js'
import * as concessionHelper from '../../../../processors/concession-helper.js'
import { assignPermit } from '../../../../processors/find-and-hash-permit.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'
import * as mappings from '../../../../processors/mapping-constants.js'
import moment from 'moment-timezone'

jest.mock('../../../../processors/concession-helper.js')
jest.mock('../../../../processors/find-and-hash-permit.js', () => ({
  assignPermit: jest.fn((_permission, _request) => {})
}))
jest.mock('../../../../processors/licence-type-display.js')

describe('licence-details > update-transaction', () => {
  describe('default', () => {
    beforeEach(jest.clearAllMocks)
    const getMockRequest = (licenceLength = '12M', transactionPageGet = { licenceLength: '' }) => ({
      cache: jest.fn(() => ({
        helpers: {
          page: {
            getCurrentPermission: () => ({ payload: { 'licence-length': licenceLength } })
          },
          status: {
            getCurrentPermission: () => {},
            setCurrentPermission: jest.fn()
          },
          transaction: {
            getCurrentPermission: () => transactionPageGet,
            setCurrentPermission: jest.fn()
          }
        }
      }))
    })

    it('should find the permit with the available data', async () => {
      const permission = { licenceLength: '1D' }
      assignPermit.mockReturnValue({ licenceLength: '12M' })
      const request = getMockRequest('1D', permission)
      await updateTransaction(request)

      expect(assignPermit).toHaveBeenCalledWith(permission, request)
    })

    it('should set the licence fulfilment page to false on the status', async () => {
      assignPermit.mockReturnValue({ licenceLength: '12M' })
      const request = getMockRequest()
      await updateTransaction(request)
      expect(request.cache.mock.results[2].value.helpers.status.setCurrentPermission).toHaveBeenCalledWith({
        [LICENCE_FULFILMENT.page]: false
      })
    })

    it('should set the transaction to update with the permit', async () => {
      const mockPermit = Symbol('permit')
      assignPermit.mockReturnValue(mockPermit)
      const permission = { licenceLength: '12M' }
      const request = getMockRequest('12M', permission)
      await updateTransaction(request)
      expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(mockPermit)
    })

    describe('checkLicenceToStart', () => {
      it('should set licenceStartTime to null when the length is 12M', async () => {
        assignPermit.mockReturnValue({ licenceLength: '12M' })
        const permission = { licenceLength: '12M' }
        const request = getMockRequest('12M', permission)
        await updateTransaction(request)

        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceStartTime: null
          })
        )
      })

      it('should set licenceToStart to after-payment when the length is 12M and the start date matches the current day', async () => {
        assignPermit.mockReturnValue({ licenceLength: '12M', licenceStartDate: moment() })
        const permission = { licenceLength: '12M', licenceStartDate: moment() }
        const request = getMockRequest('12M', permission)
        await updateTransaction(request)

        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceToStart: 'after-payment'
          })
        )
      })

      it('should not modify licenceToStart when the length is 12M and the start date is a later day', async () => {
        const licenceToStart = Symbol('licenceToStart')
        assignPermit.mockReturnValue({ licenceLength: '1D', licenceStartDate: '2100-01-01', licenceToStart })
        const permission = { licenceLength: '12M', licenceStartDate: '2100-01-01', licenceToStart }
        const request = getMockRequest('12M', permission)
        await updateTransaction(request)

        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceToStart
          })
        )
      })

      it('should not modify licenceStartTime when the length is not 12M', async () => {
        const licenceStartTime = Symbol('licenceStartTime')
        assignPermit.mockReturnValue({ licenceLength: '1D', licenceStartTime })
        const permission = { licenceLength: '1D', licenceStartTime }
        const request = getMockRequest('1D', permission)
        await updateTransaction(request)

        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceStartTime
          })
        )
      })
    })

    describe('checkContactDetails', () => {
      it('should set the correct values when the permit is physical and preferredMethodOfConfirmation and/or preferredMethodOfReminder are set to none', async () => {
        isPhysical.mockReturnValueOnce(true)
        assignPermit.mockReturnValue({ licensee: { preferredMethodOfConfirmation: mappings.HOW_CONTACTED.none }, licenceLength: '12M' })
        const permission = { licensee: { preferredMethodOfConfirmation: mappings.HOW_CONTACTED.none } }
        const request = getMockRequest('12M', permission)
        await updateTransaction(request)

        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            licensee: {
              postalFulfilment: true,
              preferredMethodOfConfirmation: mappings.HOW_CONTACTED.letter,
              preferredMethodOfReminder: mappings.HOW_CONTACTED.letter
            }
          })
        )
      })

      it('should set the correct values the permit is not physical and preferredMethodOfConfirmation and/or preferredMethodOfReminder are set to letter', async () => {
        isPhysical.mockReturnValueOnce(false)
        assignPermit.mockReturnValue({ licensee: { preferredMethodOfConfirmation: mappings.HOW_CONTACTED.letter }, licenceLength: '12M' })
        const permission = { licensee: { preferredMethodOfConfirmation: mappings.HOW_CONTACTED.letter } }
        const request = getMockRequest('12M', permission)
        await updateTransaction(request)

        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            licensee: {
              postalFulfilment: false,
              preferredMethodOfConfirmation: mappings.HOW_CONTACTED.none,
              preferredMethodOfReminder: mappings.HOW_CONTACTED.none
            }
          })
        )
      })
    })

    describe('checkDisabledConcessions', () => {
      it('should store the concession to previouslyDisabled when the licenceLength is not 12M and the permission has a disabled concession', async () => {
        concessionHelper.hasDisabled.mockReturnValueOnce(true)
        const concession = { type: mappings.CONCESSION.DISABLED }
        assignPermit.mockReturnValue({ licenceLength: '1D', concessions: [concession] })
        const permission = { licenceLength: '1D', concessions: [concession] }
        const request = getMockRequest('1D', permission)
        await updateTransaction(request)

        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            previouslyDisabled: concession
          })
        )
      })

      it('should call removeDisabled when the licenceLength is not 12M and the permission has a disabled concession', async () => {
        concessionHelper.hasDisabled.mockReturnValueOnce(true)
        const concession = { type: mappings.CONCESSION.DISABLED }
        const mockPermit = { licenceLength: '1D', concessions: [concession] }
        assignPermit.mockReturnValue(mockPermit)
        const permission = { licenceLength: '1D', concessions: [concession] }
        const request = getMockRequest('1D', permission)
        await updateTransaction(request)

        expect(concessionHelper.removeDisabled).toHaveBeenCalledWith(mockPermit)
      })

      it('should re-add the disabled concession and clear previouslyDisabled when the licenceLength is 12M and the permission previously had a disabled concession', async () => {
        concessionHelper.hasDisabled.mockReturnValueOnce(false)
        const previousConcession = Symbol('previousConcession')
        assignPermit.mockReturnValue({ licenceLength: '12M', concessions: [], previouslyDisabled: previousConcession })
        const permission = { licenceLength: '12M', concessions: [], previouslyDisabled: previousConcession }
        const request = getMockRequest('12M', permission)
        await updateTransaction(request)

        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            concessions: [previousConcession],
            previouslyDisabled: null
          })
        )
      })

      it('should set the number of rods to 2 when the licenceLength is not 12M and the licenceType is trout and course', async () => {
        assignPermit.mockReturnValue({ licenceLength: '1D', licenceType: 'Trout and coarse' })
        const permission = { licenceLength: '1D', licenceType: mappings.LICENCE_TYPE['trout-and-coarse'], numberOfRods: '10' }
        const request = getMockRequest('1D', permission)
        await updateTransaction(request)
        expect(request.cache.mock.results[3].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining({
            numberOfRods: '2'
          })
        )
      })
    })
  })
})
