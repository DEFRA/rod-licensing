import { LICENCE_FOR } from '../../../../uri.js'

const mockPostHandler = jest.fn()
const mockNextPage = jest.fn()
jest.mock('../../../../routes/next-page.js', () => ({
  nextPage: mockNextPage
}))
jest.mock('../../../../handlers/new-session-handler.js')

describe('licence-for > route', () => {
  describe('main tests', () => {
    jest.isolateModules(() => {
      const mockPageRoute = jest.fn(() => [
        {
          method: 'GET',
          handler: () => {}
        },
        {
          method: 'POST',
          handler: mockPostHandler
        }
      ])
      jest.mock('../../../../routes/page-route.js', () => mockPageRoute)
      const { default: licenceForRoute, validator } = require('../route.js')

      describe('validator', () => {
        it('should return an error, if licence-for is not you or someone-else', () => {
          const result = validator.validate({ 'licence-for': 'none' })
          expect(result.error).not.toBeUndefined()
          expect(result.error.details[0].message).toBe('"licence-for" must be one of [you, someone-else]')
        })

        it('should not return an error, if licence-for is you', () => {
          const result = validator.validate({ 'licence-for': 'you' })
          expect(result.error).toBeUndefined()
        })

        it('should not return an error, if licence-for is someone-else', () => {
          const result = validator.validate({ 'licence-for': 'someone-else' })
          expect(result.error).toBeUndefined()
        })
      })

      describe('default', () => {
        it('should call the pageRoute with licence-for, /buy/licence-for, validator and nextPage', async () => {
          expect(mockPageRoute).toBeCalledWith('licence-for', '/buy/licence-for', validator, mockNextPage)
        })
      })

      describe('POST handler', () => {
        const postHandler = licenceForRoute.find(r => r.method === 'POST').handler
        beforeEach(jest.clearAllMocks)

        it('should call default POST handler', async () => {
          const request = getMockRequest()
          const responseToolkit = Symbol('responseToolkit')
          await postHandler(request, responseToolkit)
          expect(mockPostHandler).toHaveBeenCalledWith(request, responseToolkit)
        })

        it('should call default POST handler with request and response toolkit', async () => {
          const mockRequest = getMockRequest()
          const mockResponseToolkit = {}
          await postHandler(mockRequest, mockResponseToolkit)
          expect(mockPostHandler).toHaveBeenCalledWith(mockRequest, mockResponseToolkit)
        })

        it('should return value of default POST handler', async () => {
          const retVal = Symbol('Prince')
          mockPostHandler.mockReturnValueOnce(retVal)
          expect(await postHandler(getMockRequest())).toBe(retVal)
        })

        it.each([
          ['you', 'someone-else'],
          ['someone-else', 'you']
        ])(
          'should clear personal information from session if licence for has changed from %s to %s',
          async (licenceForInPayload, licenceForInCache) => {
            const setPageCache = jest.fn()
            const mockRequest = getMockRequest({ licenceForInPayload, licenceForInCache, setPageCache })
            await postHandler(mockRequest)
            // set function should have been called with an object, containing a permissions array
            const [[newPageCache]] = setPageCache.mock.calls
            const pages = Object.keys(newPageCache.permissions[0])
            expect(pages.length).toBe(1)
            expect(pages[0]).toBe(LICENCE_FOR.page)
            expect(newPageCache.permissions[0]).toMatchSnapshot()
          }
        )

        it.each([
          ['you', 'you'],
          ['someone-else', 'someone-else']
        ])("should omit call to new session handler if licence for hasn't changed", async (licenceForInPayload, licenceForInCache) => {
          const setPageCache = jest.fn()
          const mockRequest = getMockRequest({ licenceForInPayload, licenceForInCache, setPageCache })
          await postHandler(mockRequest)
          expect(setPageCache).not.toHaveBeenCalled()
        })

        it("should omit call to new session handler if cache permission isn't set", async () => {
          const setPageCache = jest.fn()
          const getCurrentPermission = async () => undefined
          const mockRequest = getMockRequest({ getCurrentPermission, setPageCache })
          await postHandler(mockRequest)
          expect(setPageCache).not.toHaveBeenCalled()
        })

        it.each([
          ['you', 'someone-else'],
          ['someone-else', 'you']
        ])(
          'should clear personal information from _current_ permission if licence for has changed from %s to %s',
          async (licenceForInPayload, licenceForInCache) => {
            const setPageCache = jest.fn()
            const additionalPermissions = [
              getMockPermissionPageCache(),
              getMockPermissionPageCache({
                name: {
                  payload: {
                    'first-name': 'Fisher',
                    'last-name': 'Two',
                    continue: ''
                  }
                }
              })
            ]
            const currentPermissionIdx = 2
            const mockRequest = getMockRequest({
              additionalPermissions,
              currentPermissionIdx,
              licenceForInPayload,
              licenceForInCache,
              setPageCache
            })

            await postHandler(mockRequest)

            const [[newPageCache]] = setPageCache.mock.calls
            const pages = Object.keys(newPageCache.permissions[currentPermissionIdx])
            expect(pages.length).toBe(1)
            expect(pages[0]).toBe(LICENCE_FOR.page)
            expect(newPageCache.permissions[currentPermissionIdx]).toMatchSnapshot()
          }
        )
      })
    })
  })

  describe('Route test sandbox', () => {
    jest.isolateModules(() => {
      it('should attach the handler to the correct route', async () => {
        jest.mock('../../../../routes/page-route.js', () =>
          jest.fn(() => [
            {
              method: 'PATCH',
              handler: () => {}
            },
            {
              method: 'DELETE',
              handler: () => {}
            },
            {
              method: 'POST',
              handler: mockPostHandler
            },
            {
              method: 'GET',
              handler: () => {}
            }
          ])
        )
        const { default: route } = require('../route.js')
        const postHandler = route[2].handler
        await postHandler(getMockRequest())
        expect(postHandler).not.toBe(mockPostHandler)
        expect(mockPostHandler).toHaveBeenCalled()
      })
    })
  })

  const getMockRequest = spec => {
    const {
      additionalPermissions,
      currentPermissionIdx,
      getCurrentPermission,
      licenceForInPayload,
      licenceForInCache,
      setPageCache: set
    } = {
      additionalPermissions: [],
      currentPermissionIdx: 0,
      licenceForInPayload: 'you',
      licenceForInCache: 'someone-else',
      setPageCache: async () => {},
      ...spec
    }
    const samplePermissionPageCache = {
      'licence-for': {
        payload: {
          'licence-for': licenceForInCache,
          continue: ''
        }
      },
      name: {
        payload: {
          name: 'Fisher King',
          'inside-leg-measurement': '34',
          continue: ''
        }
      }
    }
    return {
      payload: {
        'licence-for': licenceForInPayload
      },
      cache: jest.fn(() => ({
        helpers: {
          status: {
            get: async () => ({
              currentPermissionIdx
            })
          },
          page: {
            get: async () => ({
              permissions: [...additionalPermissions, samplePermissionPageCache]
            }),
            set,
            getCurrentPermission: getCurrentPermission || (async () => samplePermissionPageCache['licence-for'])
          }
        }
      }))
    }
  }

  const getMockPermissionPageCache = (mockPermission = {}) => ({
    'licence-for': {
      payload: {
        'licence-for': 'someone-else',
        continue: ''
      }
    },
    isLicenceForYou: {},
    name: {
      payload: {
        'first-name': 'Fisher',
        'last-name': 'One',
        continue: ''
      }
    },
    'date-of-birth': {
      payload: {
        'date-of-birth-day': '12',
        'date-of-birth-month': '10',
        'date-of-birth-year': '1987',
        continue: ''
      }
    },
    'disability-concession': {
      payload: {
        'disability-concession': 'no',
        continue: ''
      }
    },
    'licence-to-start': {
      payload: {
        'licence-to-start': 'after-payment',
        'licence-start-date-day': '',
        'licence-start-date-month': '',
        'licence-start-date-year': '',
        continue: ''
      }
    },
    'licence-start-time': {},
    'licence-type': {
      payload: {
        'licence-type': 'trout-and-coarse-2-rod',
        continue: ''
      }
    },
    'licence-length': {
      payload: {
        'licence-length': '12M',
        continue: ''
      }
    },
    'licence-fulfilment': {
      payload: {
        'licence-option': 'paper-licence',
        continue: ''
      }
    },
    'licence-summary': {
      payload: {
        continue: ''
      }
    },
    'address-entry': {
      payload: {
        premises: '30',
        town: 'Corbenic',
        postcode: 'CO1 1CO',
        'country-code': 'GB-WLS',
        continue: ''
      }
    },
    'licence-confirmation-method': {
      payload: {
        'licence-confirmation-method': 'none',
        continue: ''
      }
    },
    contact: {
      payload: {
        'how-contacted': 'none',
        continue: ''
      }
    },
    newsletter: {
      payload: {
        newsletter: 'no',
        'email-entry': 'yes',
        continue: ''
      }
    },
    ...mockPermission
  })
})
