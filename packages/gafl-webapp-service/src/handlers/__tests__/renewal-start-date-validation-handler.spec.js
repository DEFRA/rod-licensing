import handler from '../renewal-start-date-validation-handler.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'
import { RENEWAL_START_DATE, LICENCE_SUMMARY } from '../../uri.js'

const mockValidationResult = jest.fn(() => ({ error: true }))
jest.mock('joi', () => ({
  extend: () => ({ date: () => ({ format: () => ({ min: () => ({ max: () => ({ required: () => {} }) }) }) }) }),
  object: () => ({ validate: mockValidationResult })
}))
jest.mock('../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn()
}))
jest.mock('../page-handler.js', () => ({ errorShimm: () => {} }))
jest.mock('../../uri.js', () => ({
  RENEWAL_START_DATE: {
    page: 'renew start date page',
    uri: Symbol('renewal start date uri')
  },
  LICENCE_SUMMARY: {
    uri: Symbol('licence summary uri')
  }
}))
jest.mock('../../processors/concession-helper.js')

describe.each([
  [true, 'renewal start date', RENEWAL_START_DATE.uri],
  [false, 'licence summary', LICENCE_SUMMARY.uri]
])('renewal start date validation handler', (errorFlag, uriDescription, redirectUri) => {
  beforeEach(jest.clearAllMocks)

  beforeEach(() => {
    if (!errorFlag) {
      mockValidationResult.mockReturnValueOnce({ error: false })
    }
  })

  it(`redirects to decorated uri if result.error ${errorFlag ? 'is' : "isn't"} flagged`, async () => {
    const expectedUri = Symbol('decorated uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)
    const responseToolkit = getSampleResponseToolkit()
    await handler(getSampleRequest(), responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(expectedUri)
  })

  it(`passes request to addLanguageCodeToUri if result.error ${errorFlag ? 'is' : "isn't"} flagged`, async () => {
    const request = getSampleRequest()
    await handler(request, getSampleResponseToolkit())
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, expect.anything())
  })

  it(`passes ${uriDescription} uri to addLangaugeCodeToUri if result error ${errorFlag ? 'is' : "isn't"} flagged`, async () => {
    await handler(getSampleRequest(), getSampleResponseToolkit())
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(expect.any(Object), redirectUri)
  })

  const getSampleRequest = () => ({
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: async () => ({
            payload: {
              'licence-start-date-year': 2022,
              'licence-start-date-month': 8,
              'licence-start-date-day': 10
            }
          }),
          setCurrentPermission: async () => {}
        },
        transaction: {
          getCurrentPermission: async () => ({
            renewedEndDate: '2023-08-10'
          }),
          setCurrentPermission: async () => {}
        },
        status: {
          setCurrentPermission: async () => {}
        }
      }
    })
  })
  const getSampleResponseToolkit = () => ({
    redirect: jest.fn()
  })
})
