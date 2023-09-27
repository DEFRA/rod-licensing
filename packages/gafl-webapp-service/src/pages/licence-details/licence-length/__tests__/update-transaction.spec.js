import updateTransaction from '../update-transaction'
import { LICENCE_FULFILMENT } from '../../../../uri.js'
import * as concessionHelper from '../../../../processors/concession-helper.js'
import findPermit from '../../../../processors/find-permit.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'
import * as mappings from '../../../../processors/mapping-constants.js'
import moment from 'moment-timezone'
import hashPermission from '../../../../processors/hash-permission'

jest.mock('../../../../processors/concession-helper.js')
jest.mock('../../../../processors/find-permit.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/hash-permission.js', () => jest.fn(() => 'abcde12345'))

describe('licence-details > update-transaction', () => {
  describe('default', () => {
    beforeEach(jest.clearAllMocks)
    const getMockRequest = ({
      permission = { licenceLength: '12M' },
      licenceLength = permission.licenceLength,
      transactionSet = () => {},
      statusSet = () => {}
    } = {}) => ({
      cache: jest.fn(() => ({
        helpers: {
          page: {
            getCurrentPermission: () => ({ payload: { 'licence-length': licenceLength } })
          },
          status: {
            getCurrentPermission: () => {},
            setCurrentPermission: statusSet
          },
          transaction: {
            getCurrentPermission: () => permission,
            setCurrentPermission: transactionSet
          }
        }
      }))
    })

    it('should find the permit with the available data', async () => {
      const permission = { licenceLength: '1D' }
      const request = getMockRequest({ permission })
      await updateTransaction(request)

      expect(findPermit).toHaveBeenCalledWith(permission)
    })

    it('attaches the permit to the permission', async () => {
      const transactionSet = jest.fn()
      const permit = Symbol('permit')
      findPermit.mockReturnValueOnce(permit)
      await updateTransaction(getMockRequest({ transactionSet }))
      expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ permit }))
    })

    it('hashes the permission', async () => {
      const transactionSet = jest.fn()
      const hash = Symbol('hash')
      console.log('hashPermission', hashPermission)
      hashPermission.mockReturnValueOnce(hash)
      await updateTransaction(getMockRequest({ transactionSet }))
      expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ hash }))
    })

    it('passes the permission to be hashed', async () => {
      const permission = {}
      await updateTransaction(getMockRequest({ permission }))
      expect(hashPermission).toHaveBeenCalledWith(permission)
    })

    it('only retrieves the permit if the hash has changed', async () => {
      const hash = Symbol('hash')
      const permission = { property: 'value', permit: Symbol('permit'), hash }
      hashPermission.mockReturnValueOnce(hash)
      await updateTransaction(getMockRequest({ permission }))
      expect(findPermit).not.toHaveBeenCalled()
    })

    it('should set the licence fulfilment page to false on the status', async () => {
      const statusSet = jest.fn()
      const request = getMockRequest({ statusSet })
      await updateTransaction(request)
      expect(statusSet).toHaveBeenCalledWith({
        [LICENCE_FULFILMENT.page]: false
      })
    })

    describe('checkLicenceToStart', () => {
      it('should set licenceStartTime to null when the length is 12M', async () => {
        const transactionSet = jest.fn()
        const request = getMockRequest({ transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ licenceStartTime: null }))
      })

      it('should set licenceToStart to after-payment when the length is 12M and the start date matches the current day', async () => {
        const transactionSet = jest.fn()
        const permission = { licenceLength: '12M', licenceStartDate: moment() }
        const request = getMockRequest({ permission, transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ licenceToStart: 'after-payment' }))
      })

      it('should not modify licenceToStart when the length is 12M and the start date is a later day', async () => {
        const transactionSet = jest.fn()
        const licenceToStart = Symbol('licenceToStart')
        const permission = { licenceLength: '12M', licenceStartDate: '2100-01-01', licenceToStart }
        const request = getMockRequest({ permission, transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ licenceToStart }))
      })

      it('should not modify licenceStartTime when the length is not 12M', async () => {
        const transactionSet = jest.fn()
        const licenceStartTime = Symbol('licenceStartTime')
        const permission = { licenceLength: '1D', licenceStartTime }
        const request = getMockRequest({ permission, transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ licenceStartTime }))
      })
    })

    describe('checkContactDetails', () => {
      it('should set the correct values when the permit is physical and preferredMethodOfConfirmation and/or preferredMethodOfReminder are set to none', async () => {
        const transactionSet = jest.fn()
        isPhysical.mockReturnValueOnce(true)
        const permission = { licensee: { preferredMethodOfConfirmation: mappings.HOW_CONTACTED.none } }
        const request = getMockRequest({ licenceLength: '12M', permission, transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(
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
        const transactionSet = jest.fn()
        const permission = { licensee: { preferredMethodOfConfirmation: mappings.HOW_CONTACTED.letter } }
        const request = getMockRequest({ licenceLength: '12M', permission, transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(
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
        const transactionSet = jest.fn()
        concessionHelper.hasDisabled.mockReturnValueOnce(true)
        const concession = { type: mappings.CONCESSION.DISABLED }
        const permission = { licenceLength: '1D', concessions: [concession] }
        const request = getMockRequest({ permission, transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(
          expect.objectContaining({
            previouslyDisabled: concession
          })
        )
      })

      it('should call removeDisabled when the licenceLength is not 12M and the permission has a disabled concession', async () => {
        concessionHelper.hasDisabled.mockReturnValueOnce(true)
        const concession = { type: mappings.CONCESSION.DISABLED }
        const permission = { licenceLength: '1D', concessions: [concession] }
        const request = getMockRequest({ permission })
        await updateTransaction(request)

        expect(concessionHelper.removeDisabled).toHaveBeenCalledWith(permission)
      })

      it('should re-add the disabled concession and clear previouslyDisabled when the licenceLength is 12M and the permission previously had a disabled concession', async () => {
        const transactionSet = jest.fn()
        concessionHelper.hasDisabled.mockReturnValueOnce(false)
        const previousConcession = Symbol('previousConcession')
        const permission = { licenceLength: '12M', concessions: [], previouslyDisabled: previousConcession }
        const request = getMockRequest({ permission, transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(
          expect.objectContaining({
            concessions: [previousConcession],
            previouslyDisabled: null
          })
        )
      })

      it('should set the number of rods to 2 when the licenceLength is not 12M and the licenceType is trout and course', async () => {
        const transactionSet = jest.fn()
        const permission = { licenceLength: '1D', licenceType: mappings.LICENCE_TYPE['trout-and-coarse'], numberOfRods: '10' }
        const request = getMockRequest({ permission, transactionSet })
        await updateTransaction(request)

        expect(transactionSet).toHaveBeenCalledWith(expect.objectContaining({ numberOfRods: '2' }))
      })
    })
  })
})
