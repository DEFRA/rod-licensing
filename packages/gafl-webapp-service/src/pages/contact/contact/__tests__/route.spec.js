import { getData, validator } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'
import { hasJunior } from '../../../../processors/concession-helper.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

jest.mock('../../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../uri.js', () => ({
  ...jest.requireActual('../../../../uri.js'),
  CONTACT: {
    page: 'mock-contact-page',
    uri: '/mock/contact/page/uri'
  },
  DATE_OF_BIRTH: {
    uri: '/mock/date/of/birth/uri'
  }
}))
jest.mock('../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))
jest.mock('../../../../processors/concession-helper.js', () => ({
  hasJunior: jest.fn(() => false)
}))
jest.mock('../../../../processors/mapping-constants.js', () => ({
  smoke_signal: 'smoke_signal',
  telegraph: 'telegraph',
  chinese_whispers: 'high knees whispa',
  semaphore: 'semaphore'
}))

describe('name > route', () => {
  const mockStatusCacheGet = jest.fn(() => ({
    isLicenceForYou: true
  }))
  const mockTransactionCacheGet = jest.fn(async () => ({
    licensee: {
      birthDate: 'birthDate'
    },
    licenceLength: 'licenceLength',
    licenceStartDate: 'licenceStartDate'
  }))

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        },
        status: {
          getCurrentPermission: mockStatusCacheGet
        }
      }
    })
  }

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the status cache', async () => {
      mockStatusCacheGet.mockReturnValueOnce({ isLicenceForYou: true })
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the status cache', async () => {
      mockStatusCacheGet.mockReturnValueOnce({ isLicenceForYou: false })
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it('should return licensee from transaction permission', async () => {
      const licensee = { birthDate: 'birthDate' }
      mockTransactionCacheGet.mockReturnValueOnce({
        licensee: licensee,
        licenceLength: 'licenceLength',
        licenceStartDate: 'licenceStartDate'
      })
      const result = await getData(mockRequest)
      expect(result.licensee).toBe(licensee)
    })

    it.each([
      [true],
      [false]
    ])('isPhysical should match output of isPhysical function', async isPhysicalVal => {
      isPhysical.mockReturnValueOnce(isPhysicalVal)
      const result = await getData(mockRequest)
      expect(result.isPhysical).toEqual(isPhysicalVal)
    })

    it.each([
      [true],
      [false]
    ])('isJunior should match output of hasJunior function', async hasJuniorVal => {
      hasJunior.mockReturnValueOnce(hasJuniorVal)
      const result = await getData(mockRequest)
      expect(result.isJunior).toEqual(hasJuniorVal)
    })

    it('how contacted returns enum', async () => {
      const result = await getData(mockRequest)
      expect(result.howContacted).toEqual(HOW_CONTACTED)
    })
  })

  describe('default', () => {
    it('should call the pageRoute with date-of-birth, /buy/date-of-birth, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('mock-contact-page', '/mock/contact/page/uri', validator, nextPage, getData)
    })
  })
})
