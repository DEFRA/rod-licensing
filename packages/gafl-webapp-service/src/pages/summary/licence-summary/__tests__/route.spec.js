import { getFromSummary, getData } from '../route'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../constants.js'
import {
  DATE_OF_BIRTH,
  DISABILITY_CONCESSION,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEW_TRANSACTION
} from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import '../../find-permit.js'
import { licenceTypeDisplay, getErrorPage } from '../../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))
jest.mock('../../find-permit.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/uri-helper.js')

describe('licence-summary > route', () => {
  beforeEach(jest.clearAllMocks)

  describe('getFromSummary', () => {
    it('should return licence-summary, if it is a renewal', async () => {
      const result = await getFromSummary(undefined, true)
      expect(result).toBe(LICENCE_SUMMARY_SEEN)
    })

    it('should return licence-summary, if fromSummary has not been set and it is not a renewal', async () => {
      const result = await getFromSummary()
      expect(result).toBe(LICENCE_SUMMARY_SEEN)
    })

    it('should set fromSummary to contact-summary, if fromSummary is contact-summary and it is not a renewal', async () => {
      const result = await getFromSummary(CONTACT_SUMMARY_SEEN)
      expect(result).toBe(CONTACT_SUMMARY_SEEN, false)
    })
  })

  describe('getData', () => {
    beforeEach(getErrorPage.mockReset)

    it('should return the name page uri', async () => {
      const expectedUri = Symbol('name page uri')
      addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

      const {
        uri: { name }
      } = await getData(getSampleRequest())

      expect(name).toEqual(expectedUri)
    })

    it.each([
      [NAME.uri],
      [LICENCE_LENGTH.uri],
      [LICENCE_TYPE.uri],
      [LICENCE_TO_START.uri],
      [DATE_OF_BIRTH.uri],
      [DISABILITY_CONCESSION.uri],
      [LICENCE_TO_START.uri],
      [NEW_TRANSACTION.uri]
    ])('addLanguageCodeToUri is called with the expected arguments', async uri => {
      const mockedRequest = getSampleRequest()

      await getData(mockedRequest)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockedRequest, uri)
    })

    it('multibuy - should return the name page uri', async () => {
      isMultibuyForYou.mockImplementationOnce(() => true)
      const expectedUri = Symbol('return value')
      addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

      const {
        uri: { name }
      } = await getData(getSampleRequest())

      expect(name).toEqual(expectedUri)
    })

    it('licenceTypeDisplay is called with the expected arguments', async () => {
      const catalog = Symbol('mock catalog')
      const permission = getSamplePermission()
      const sampleRequest = getSampleRequest({
        getTransaction: () => ({ permissions: [permission] }),
        getCatalog: () => catalog
      })

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const expectedLicenceType = Symbol('expected licence type')
      licenceTypeDisplay.mockReturnValueOnce(expectedLicenceType)

      const result = await getData(getSampleRequest())

      expect(result.licenceTypeStr).toEqual(expectedLicenceType)
    })

    it("throws a GetDataRedirect if getErrorPage returns a value and it isn't a renewal", async () => {
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: false })
      })
      getErrorPage.mockReturnValueOnce('error page')

      const testFunction = async () => getData(request)

      await expect(testFunction).rejects.toThrow(GetDataRedirect)
    })

    it("doesn't throw a GetDataRedirect if getErrorPage returns an empty string", async () => {
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: false })
      })
      getErrorPage.mockReturnValueOnce('')
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
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: true })
      })
      getErrorPage.mockReturnValueOnce('error page')
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
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: false })
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
      const permission = getSamplePermission({ isRenewal: false })
      const request = getSampleRequest({
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
  })
})

const getSampleRequest = ({
  getCurrentStatusPermission = () => ({}),
  setCurrentStatusPermission = () => {},
  getCurrentTransactionPermission = () => getSamplePermission(),
  setCurrentTransactionPermission = () => {},
  getTransaction = () => ({ permissions: [getSamplePermission()] }),
  getCatalog = () => ({
    licence_type_radio_salmon: 'Salmon and sea trout'
  })
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: getCurrentStatusPermission,
        setCurrentPermission: setCurrentStatusPermission
      },
      transaction: {
        get: getTransaction,
        set: () => {},
        getCurrentPermission: getCurrentTransactionPermission,
        setCurrentPermission: setCurrentTransactionPermission
      }
    }
  }),
  i18n: {
    getCatalog
  },
  url: {
    search: ''
  },
  path: ''
})

const getSamplePermission = (overrides = {}) => ({
  isLicenceForYou: true,
  licenceStartDate: '2021-07-01',
  numberOfRods: '3',
  licenceType: 'Salmon and sea trout',
  licenceLength: '12M',
  licensee: {
    firstName: 'Brenin',
    lastName: 'Pysgotwr',
    birthDate: '1946-01-01'
  },
  permit: {
    cost: 6
  },
  ...overrides
})
