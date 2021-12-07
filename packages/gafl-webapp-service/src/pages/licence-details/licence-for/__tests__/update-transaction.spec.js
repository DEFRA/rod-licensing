import updateTransaction from '../update-transaction'
import { LICENCE_FOR } from '../../../../uri.js'

describe('licence-for > update-transaction', () => {
  beforeEach(jest.clearAllMocks)

  describe('default', () => {
    it('should set isLicenceForYou to true if user has selected you', async () => {
      const mockStatusCacheSet = jest.fn()
      const mockRequest = getMockRequest({ licenceForInPayload: 'you', licenceForInCache: 'you', setCurrentPermission: mockStatusCacheSet })
      await updateTransaction(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith({ isLicenceForYou: true })
    })

    it('should set isLicenceForYou to false if user has selected someone-else', async () => {
      const mockStatusCacheSet = jest.fn()
      const mockRequest = getMockRequest({ licenceForInPayload: 'someone-else', licenceForInCache: 'someone-else', setCurrentPermission: mockStatusCacheSet })
      await updateTransaction(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith({ isLicenceForYou: false })
    })

    it.each([
      ['you', 'someone-else'],
      ['someone-else', 'you']
    ])('should clear personal information from session if licence for has changed from %s to %s', async (licenceForInPayload, licenceForInCache) => {
      const setPageCache = jest.fn()
      const mockRequest = getMockRequest({ licenceForInPayload, licenceForInCache, setPageCache })

      await updateTransaction(mockRequest)

      // set function should have been called with an object, containing a permissions array
      const [[newPageCache]] = setPageCache.mock.calls
      const pages = Object.keys(newPageCache.permissions[0])
      expect(pages.length).toBe(1)
      expect(pages[0]).toBe(LICENCE_FOR.page)
      expect(newPageCache.permissions[0]).toMatchSnapshot()
    })

    it.each([
      ['you', 'you'],
      ['someone-else', 'someone-else']
    ])('should leave page cache untouched if licence for hasn\'t changed', async (licenceForInPayload, licenceForInCache) => {
      const setPageCache = jest.fn()
      const mockRequest = getMockRequest({ licenceForInPayload, licenceForInCache, setPageCache })

      await updateTransaction(mockRequest)

      expect(setPageCache).not.toHaveBeenCalled()
    })

    it.each([
      ['you', 'someone-else'],
      ['someone-else', 'you']
    ])('should clear personal information from _current_ permission if licence for has changed from %s to %s', async (licenceForInPayload, licenceForInCache) => {
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
      const mockRequest = getMockRequest({ additionalPermissions, currentPermissionIdx, licenceForInPayload, licenceForInCache, setPageCache })

      await updateTransaction(mockRequest)

      const [[newPageCache]] = setPageCache.mock.calls
      const pages = Object.keys(newPageCache.permissions[currentPermissionIdx])
      expect(pages.length).toBe(1)
      expect(pages[0]).toBe(LICENCE_FOR.page)
      expect(newPageCache.permissions[currentPermissionIdx]).toMatchSnapshot()
    })
  })

  const getMockRequest = (spec) => {
    const {
      additionalPermissions,
      currentPermissionIdx,
      getCurrentPermission,
      licenceForInPayload,
      licenceForInCache,
      setCurrentPermission,
      setPageCache
    } = {
      additionalPermissions: [],
      currentPermissionIdx: 0,
      licenceForInPayload: 'you',
      licenceForInCache: 'someone-else',
      setPageCache: async () => {},
      setCurrentPermission: async () => {},
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
            }),
            setCurrentPermission
          },
          page: {
            get: async () => ({
              permissions: [
                ...additionalPermissions,
                samplePermissionPageCache
              ]
            }),
            set: setPageCache,
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
    'licence-start-time': {

    },
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
