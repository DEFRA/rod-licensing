import { getData } from '../route'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { CONCESSION } from '../../../../processors/mapping-constants.js'
import { licenceTypeDisplay, getErrorPage } from '../../../../processors/licence-type-display.js'
import { CHANGE_LICENCE_OPTIONS_SEEN } from '../../../../constants.js'
import { findPermit } from '../../../../processors/find-permit.js'

jest.mock('../../../../processors/find-permit.js')
jest.mock('../../../../processors/mapping-constants.js', () => ({
  CONCESSION: {
    SENIOR: 'Senior person',
    JUNIOR: 'Junior person',
    DISABLED: 'Disabled person'
  },
  LICENCE_TYPE: {
    'trout-and-coarse': 'Trout and coarse',
    'salmon-and-sea-trout': 'Salmon and sea trout'
  },
  CONCESSION_PROOF: {
    NI: 'NIN',
    blueBadge: 'BB',
    none: 'Not Proof'
  }
}))
jest.mock('../../../../processors/date-and-time-display.js', () => ({
  ...jest.requireActual('../../../../processors/date-and-time-display.js'),
  displayStartTime: () => 'Test on 1 July 2021'
}))
jest.mock('../../../../processors/licence-type-display.js', () => ({
  licenceTypeDisplay: jest.fn(),
  getErrorPage: jest.fn(() => '')
}))

const getSamplePermission = overrides => ({
  licenceStartDate: '2021-07-01',
  renewedEndDate: '2021-07-02',
  permit: {
    cost: 6
  },
  licensee: {
    birthDate: '1946-01-01'
  },
  licenceType: 'Salmon and sea trout',
  numberOfRods: '3',
  ...overrides
})

describe('change-licence-options > route', () => {
  describe('getData', () => {
    beforeEach(jest.clearAllMocks)

    it.each([
      ['standard permission', getSamplePermission()],
      ['continuing, expired permission', getSamplePermission({ renewedEndDate: '2021-07-01' })],
      ['disabled permission', getSamplePermission({ concessions: [{ type: CONCESSION.DISABLED }] })]
    ])('test output of getData for a %s', async (_description, permission) => {
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => permission
      })
      licenceTypeDisplay.mockReturnValueOnce(Symbol('Salmon and sea trout'))
      const result = await getData(request)
      expect(result).toMatchSnapshot()
    })

    it("throws a GetDataRedirect if getErrorPage returns a value and it isn't a renewal", async () => {
      const request = getSampleRequest({
        getCurrentStatusPermission: () => ({ renewal: false })
      })
      getErrorPage.mockReturnValueOnce('error page')

      const testFunction = async () => getData(request)

      await expect(testFunction).rejects.toThrow(GetDataRedirect)
    })

    it("doesn't throw a GetDataRedirect if getErrorPage returns an empty string", async () => {
      const request = getSampleRequest({
        getCurrentStatusPermission: () => ({ renewal: false })
      })
      const getDataResult = async () => {
        try {
          await getData(request)
        } catch (e) {
          return e
        }
      }

      const result = await getDataResult()

      await expect(result).toBeUndefined()
    })

    it("doesn't throw a GetDataRedirect if getErrorPage returns a value but it's a renewal", async () => {
      const request = getSampleRequest({
        getCurrentStatusPermission: () => ({ renewal: true })
      })
      const getDataResult = async () => {
        try {
          await getData(request)
        } catch (e) {
          return e
        }
      }

      const result = await getDataResult()

      await expect(result instanceof GetDataRedirect).toBeFalsy()
    })

    it('passes return value of getErrorPage to thrown GetDataRedirect', async () => {
      const expectedRedirectUrl = Symbol('error page')
      getErrorPage.mockReturnValueOnce(expectedRedirectUrl)
      const request = getSampleRequest({
        getCurrentStatusPermission: () => ({ renewal: false })
      })
      const runGetData = async () => {
        try {
          await getData(request)
        } catch (e) {
          return e
        }
      }
      const thrownError = await runGetData()
      expect(thrownError.redirectUrl).toEqual(expectedRedirectUrl)
    })

    it('passes permission to getErrorPage', async () => {
      const permission = Symbol('permission')
      const request = getSampleRequest({
        getCurrentStatusPermission: () => ({ renewal: false }),
        getCurrentTransactionPermission: () => permission
      })
      const runGetData = async () => {
        try {
          await getData(request)
        } catch (e) {
          return e
        }
      }

      await runGetData()

      expect(getErrorPage).toHaveBeenCalledWith(permission)
    })

    it('updates current status permission', async () => {
      const permission = getSamplePermission()
      const getCurrentStatusPermission = () => permission
      const setCurrentStatusPermission = jest.fn()
      await getData(getSampleRequest({ getCurrentStatusPermission, setCurrentStatusPermission }))
      expect(setCurrentStatusPermission).toHaveBeenCalledWith(expect.objectContaining(permission))
    })

    it('sets fromLicenceOptions before updating current status permission', async () => {
      const setCurrentStatusPermission = jest.fn()
      await getData(getSampleRequest({ setCurrentStatusPermission }))
      expect(setCurrentStatusPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
        })
      )
    })

    it('calls findPermit with permission and request', async () => {
      const permission = getSamplePermission()
      const request = getSampleRequest({ getCurrentTransactionPermission: () => permission })
      await getData(request)
      expect(findPermit).toHaveBeenCalledWith(permission, request)
    })

    const getSampleRequest = ({
      getCurrentStatusPermission = () => ({}),
      setCurrentStatusPermission = () => {},
      getCurrentTransactionPermission = () => getSamplePermission(),
      setCurrentTransactionPermission = () => {}
    }) => ({
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: getCurrentStatusPermission,
            setCurrentPermission: setCurrentStatusPermission
          },
          transaction: {
            get: () => {},
            set: () => {},
            getCurrentPermission: getCurrentTransactionPermission,
            setCurrentPermission: setCurrentTransactionPermission
          }
        }
      }),
      i18n: {
        getCatalog: () => ({
          licence_start_time_am_text_0: 'Test',
          licence_type_radio_salmon: 'Salmon and sea trout',
          licence_type_radio_trout_two_rod: 'Trout and coarse, up to 2 rods',
          licence_type_radio_trout_three_rod: 'Trout and coarse, up to 3 rods'
        })
      }
    })
  })
})
