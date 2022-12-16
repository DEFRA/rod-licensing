import handler from '../authentication-handler.js'
import { IDENTIFY, CONTROLLER, RENEWAL_INACTIVE } from '../../uri.js'
import { salesApi } from '@defra-fish/connectors-lib'

jest.mock('../../processors/uri-helper.js')
jest.mock('../page-handler.js', () => ({ errorShimm: () => {} }))
jest.mock('../../uri.js', () => ({
  IDENTIFY: {
    page: 'identify page',
    uri: Symbol('identify uri')
  },
  CONTROLLER: {
    uri: Symbol('controller uri')
  },
  RENEWAL_INACTIVE: {
    uri: Symbol('renewal inactive uri')
  }
}))
jest.mock('../../processors/concession-helper.js')
jest.mock('@defra-fish/connectors-lib')
jest.mock('../../processors/renewals-write-cache.js', () => ({
  setUpCacheFromAuthenticationResult: async () => {},
  setUpPayloads: async () => {}
}))
const mockDiff = jest.fn(() => 1)
jest.mock('moment-timezone', () => () => ({
  diff: mockDiff,
  tz: () => ({ startOf: () => {} })
}))
const getSampleAuthResult = (description = 'M', durationMagnitude = 12) => ({
  permission: {
    endDate: '',
    permit: {
      durationDesignator: {
        description
      },
      durationMagnitude
    }
  }
})

describe.each([
  [false, 'identify', IDENTIFY.uri, 1],
  [getSampleAuthResult(), 'controller', CONTROLLER.uri, -1],
  [getSampleAuthResult(), 'renewal inactive', RENEWAL_INACTIVE.uri, 61],
  [getSampleAuthResult(), 'renewal inactive', RENEWAL_INACTIVE.uri, -61],
  [getSampleAuthResult('N', 1), 'renewal inactive', RENEWAL_INACTIVE.uri, -61]
])('renewal start date validation handler', (authResult, uriDescription, redirectUri, daysDiff) => {
  beforeEach(() => {
    jest.clearAllMocks()
    salesApi.authenticate.mockReturnValueOnce(authResult)
    mockDiff.mockReturnValue(daysDiff)
  })

  it(`redirects to decorated uri if auth ${authResult ? 'passes' : 'fails'}`, async () => {
    const mockRequest = getSampleRequest()
    const responseToolkit = getSampleResponseToolkit()
    await handler(mockRequest, responseToolkit)
    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(mockRequest, redirectUri)
  })

  const getSampleRequest = () => ({
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: async () => ({
            payload: {
              'date-of-birth-year': 1970,
              'date-of-birth-month': 1,
              'date-of-birth-day': 1,
              postcode: 'AB1 1AB',
              referenceNumber: 'ABC123'
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
          getCurrentPermission: async () => {},
          setCurrentPermission: async () => {}
        }
      }
    })
  })
  const getSampleResponseToolkit = () => ({
    redirectWithLanguageCode: jest.fn()
  })
})
