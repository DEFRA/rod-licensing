import { getLicenseeDetailsSummaryRows, checkNavigation, getData, setMultibuyValues } from '../route'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import {
  ADDRESS_ENTRY,
  ADDRESS_SELECT,
  CONTACT,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  LICENCE_SUMMARY
} from '../../../../uri.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

const address = {
  firstName: 'Fester',
  lastName: 'Tester',
  premises: '14 Howecroft Court',
  street: 'Eastmead Lane',
  town: 'Bristol',
  postcode: 'BS9 1HJ'
}

describe('contact-summary > route', () => {
  describe('getLicenseeDetailsSummaryRows', () => {
    describe('when purchasing a 12 month (physical licence) with postal fulfilment', () => {
      it('should display the Licence as post, Licence Confirmation and Contact as the email and Newsletter as no', () => {
        const permission = {
          licenceLength: '12M',
          licensee: {
            ...address,
            postalFulfilment: true,
            preferredMethodOfConfirmation: 'Email',
            preferredMethodOfReminder: 'Email',
            email: 'new3@example.com',
            preferredMethodOfNewsletter: 'Prefer not to be contacted'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Licence as post, Licence Confirmation and Contact as the phone number and Newsletter as yes', () => {
        const permission = {
          licenceLength: '12M',
          licensee: {
            ...address,
            postalFulfilment: true,
            preferredMethodOfConfirmation: 'Text',
            preferredMethodOfReminder: 'Text',
            mobilePhone: '07700900900',
            preferredMethodOfNewsletter: 'Yes'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Licence as post, Licence Confirmation as note of licence and Contact as post', () => {
        const permission = {
          licenceLength: '12M',
          licensee: {
            ...address,
            postalFulfilment: true,
            preferredMethodOfConfirmation: 'Prefer not to be contacted',
            preferredMethodOfReminder: 'Letter'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
        expect(summaryTable).toMatchSnapshot()
      })
    })

    describe('when purchasing a 12 month (physical licence) without postal fulfilment', () => {
      it('should display the Licence and Contact as the email and Newsletter as no', () => {
        const permission = {
          licenceLength: '12M',
          licensee: {
            ...address,
            postalFulfilment: false,
            preferredMethodOfConfirmation: 'Email',
            preferredMethodOfReminder: 'Email',
            email: 'new3@example.com',
            preferredMethodOfNewsletter: 'Prefer not to be contacted'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Licence and Contact as the phone number and Newsletter as yes', () => {
        const permission = {
          licenceLength: '12M',
          licensee: {
            ...address,
            postalFulfilment: false,
            preferredMethodOfConfirmation: 'Text',
            preferredMethodOfReminder: 'Text',
            mobilePhone: '07700900900',
            preferredMethodOfNewsletter: 'Yes'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
        expect(summaryTable).toMatchSnapshot()
      })
    })

    describe('when purchasing a 1 day (non physical licence)', () => {
      it('should display the Contact as the email and Newsletter as no', () => {
        const permission = {
          licenceLength: '1D',
          licensee: {
            ...address,
            preferredMethodOfConfirmation: 'Email',
            preferredMethodOfReminder: 'Email',
            email: 'new3@example.com',
            preferredMethodOfNewsletter: 'Prefer not to be contacted'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Contact as the phone number and Newsletter as yes', () => {
        const permission = {
          licenceLength: '1D',
          licensee: {
            ...address,
            postalFulfilment: false,
            preferredMethodOfConfirmation: 'Text',
            preferredMethodOfReminder: 'Text',
            mobilePhone: '07700900900',
            preferredMethodOfNewsletter: 'Yes'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Contact as Make a note on confirmation', () => {
        const permission = {
          licenceLength: '1D',
          licensee: {
            ...address,
            postalFulfilment: false,
            preferredMethodOfConfirmation: 'Prefer not to be contacted',
            preferredMethodOfReminder: 'Prefer not to be contacted',
            preferredMethodOfNewsletter: 'Yes'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
        expect(summaryTable).toMatchSnapshot()
      })
    })

    it('should have the newsletter row if isLicenceForYou is true', () => {
      const permission = {
        licenceLength: '1D',
        licensee: {
          ...address
        },
        isLicenceForYou: true
      }
      const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
      expect(summaryTable).toMatchSnapshot()
    })

    it('should not have the newsletter row if isLicenceForYou is false', () => {
      const permission = {
        licenceLength: '1D',
        licensee: {
          ...address
        },
        isLicenceForYou: false
      }
      const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB')
      expect(summaryTable).toMatchSnapshot()
    })
  })

  describe('checkNavigation', () => {
    it('should throw a GetDataRedirect if licence-fulfilment page is false on the status', () => {
      const status = {
        renewal: true,
        [LICENCE_FULFILMENT.page]: false
      }
      const permission = { licenceLength: '12M' }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if licence-confirmation page is false on the status', () => {
      const status = {
        renewal: true,
        [LICENCE_FULFILMENT.page]: true,
        [LICENCE_CONFIRMATION_METHOD.page]: false
      }
      const permission = { licenceLength: '12M' }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if address entry and address select page is false on the status', () => {
      const status = {
        renewal: false,
        [ADDRESS_ENTRY.page]: false,
        [ADDRESS_SELECT.page]: false
      }
      const permission = { licenceLength: '12M' }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if contact page is false on the status', () => {
      const status = {
        renewal: false,
        [ADDRESS_ENTRY.page]: true,
        [ADDRESS_SELECT.page]: true,
        [CONTACT.page]: false
      }
      const permission = { licenceLength: '12M' }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })
  })

  describe('Multibuy', () => {
    it('should update the multibuy address details based on if multibuy and licence for you', () => {
      const permission = [
        {
          licensee: {
            ...address,
            isLicenceForYou: true
          }
        },
        {
          licensee: {
            firstName: 'Fester',
            lastName: 'Tester',
            premises: undefined,
            street: undefined,
            locality: undefined,
            town: undefined,
            postcode: undefined,
            isLicenceForYou: true
          }
        }
      ]
      const transaction = {
        permissions: {
          filter: jest.fn(() => permission)
        }
      }
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = setMultibuyValues(transaction)
      expect(result).toEqual(permission[0].licensee)
    })
  })

  describe('getData', () => {
    const mockStatusCacheGet = jest.fn(() => ({}))
    const mockStatusCacheSet = jest.fn()
    const mockTransactionCacheGet = jest.fn(() => ({
      licenceStartDate: '2021-07-01',
      numberOfRods: '3',
      licenceType: 'Salmon and sea trout',
      licenceLength: '12M',
      permission: [
        {
          licensee: {
            firstName: 'Graham',
            lastName: 'Willis',
            birthDate: '1946-01-01',
            ...address,
            isLicenceForYou: true
          }
        },
        {
          licensee: {
            firstName: 'Graham',
            lastName: 'Willis',
            birthDate: '1946-01-01',
            premises: undefined,
            street: undefined,
            locality: undefined,
            town: undefined,
            postcode: undefined,
            isLicenceForYou: true
          }
        }
      ],
      permit: {
        cost: 6
      }
    }))
    const mockTransactionCacheSet = jest.fn()

    const generateRequestMock = (transaction = {}) => ({
      cache: jest.fn(() => ({
        helpers: {
          transaction: {
            get: jest.fn(() => transaction),
            set: jest.fn()
          }
        }
      }))
    })

    const mockRequest = (transaction = {}) => ({
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: mockStatusCacheGet,
            setCurrentPermission: mockStatusCacheSet
          },
          transaction: {
            get: jest.fn(() => transaction),
            getCurrentPermission: mockTransactionCacheGet,
            setCurrentPermission: mockTransactionCacheSet
          }
        }
      })
    })

    it('should return the licence summary page uri', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({
        renewal: false,
        [ADDRESS_ENTRY.page]: true,
        [ADDRESS_SELECT.page]: true,
        [CONTACT.page]: true,
        [LICENCE_FULFILMENT.page]: true,
        [LICENCE_CONFIRMATION_METHOD.page]: true
      }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: {
          firstName: 'Graham',
          lastName: 'Willis',
          birthDate: '1946-01-01',
          premises: undefined,
          street: undefined,
          locality: undefined,
          town: undefined,
          postcode: undefined,
          isLicenceForYou: true,
          countryCode: 'GB'
        }
      }))
      const permission = [
        {
          licensee: {
            firstName: 'Graham',
            lastName: 'Willis',
            birthDate: '1946-01-01',
            premises: '14 Howecroft Court',
            street: 'Eastmead Lane',
            locality: 'Bristolville',
            town: 'Bristol',
            postcode: 'BS9 1HJ',
            countryCode: 'GB',
            isLicenceForYou: true
          }
        },
        {
          licensee: {
            firstName: 'Graham',
            lastName: 'Willis',
            birthDate: '1946-01-01',
            premises: undefined,
            street: undefined,
            locality: undefined,
            town: undefined,
            postcode: undefined,
            isLicenceForYou: true
          }
        }
      ]
      const transaction = {
        permissions: {
          length: 1,
          isLicenceForYou: true,
          filter: jest.fn(() => permission)
        }
      }
      isMultibuyForYou.mockImplementationOnce(() => true)
      generateRequestMock(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.licenceSummary).toBe(LICENCE_SUMMARY.uri)
    })
  })
})
