import { getLicenseeDetailsSummaryRows, checkNavigation, getData } from '../route'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import {
  ADDRESS_ENTRY,
  ADDRESS_SELECT,
  CONTACT,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  ADDRESS_LOOKUP,
  NEWSLETTER
} from '../../../../uri.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'
import '../../../../processors/refdata-helper.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

jest.mock('../../../../processors/refdata-helper.js', () => ({
  countries: {
    nameFromCode: () => 'United Kingdom'
  }
}))

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn(() => Symbol('addLanguageCodeToUri'))
}))

jest.mock('../../../../processors/mapping-constants', () => ({
  HOW_CONTACTED: {
    email: 'Email',
    none: 'Prefer not to be contacted'
  }
}))

const address = {
  firstName: 'Fester',
  lastName: 'Tester',
  premises: '14 Howecroft Court',
  street: 'Eastmead Lane',
  town: 'Bristol',
  postcode: 'BS9 1HJ'
}

const generateRequestMock = query => ({
  query,
  url: {
    search: ''
  }
})

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
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
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
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
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
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
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
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
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
            preferredMethodOfNewsletter: 'Text'
          }
        }
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
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
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
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
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
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
        const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
        expect(summaryTable).toMatchSnapshot()
      })
    })

    it('should have the newsletter is set have preferred method and if isLicenceForYou is true', () => {
      const permission = {
        licenceLength: '1D',
        licensee: {
          ...address,
          postalFulfilment: false,
          preferredMethodOfConfirmation: 'Prefer not to be contacted',
          preferredMethodOfReminder: 'Prefer not to be contacted',
          preferredMethodOfNewsletter: 'Email'
        },
        isLicenceForYou: true
      }
      const query = {
        [HOW_CONTACTED.email]: 'Email'
      }
      const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock(query))
      expect(summaryTable).toMatchSnapshot()
    })

    it('should have the newsletter set to no if have preferred method and if isLicenceForYou is true', () => {
      const permission = {
        licenceLength: '1D',
        licensee: {
          ...address,
          postalFulfilment: false,
          preferredMethodOfConfirmation: 'Prefer not to be contacted',
          preferredMethodOfReminder: 'Prefer not to be contacted',
          preferredMethodOfNewsletter: 'Prefer not to be contacted'
        },
        isLicenceForYou: true
      }
      const query = {
        [HOW_CONTACTED.email]: 'Prefer not to be contacted'
      }
      const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock(query))
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
      const summaryTable = getLicenseeDetailsSummaryRows(permission, 'GB', generateRequestMock())
      expect(summaryTable).toMatchSnapshot()
    })

    describe('addLanguageCodeToUri', () => {
      beforeEach(jest.clearAllMocks)

      it.each([[ADDRESS_LOOKUP.uri], [LICENCE_FULFILMENT.uri], [LICENCE_CONFIRMATION_METHOD.uri], [CONTACT.uri], [NEWSLETTER.uri]])(
        'test addLanguageCodeToUri is called correctly',
        async urlToCheck => {
          const permission = {
            permit: {
              cost: 1
            },
            licenceLength: '12M',
            isLicenceForYou: true,
            licensee: {
              birthDate: '1996-01-01',
              postalFulfilment: true
            }
          }

          const mockRequest = generateRequestMock

          getLicenseeDetailsSummaryRows(permission, 'GB', mockRequest)

          expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, urlToCheck)
        }
      )
    })
  })

  describe('checkNavigation', () => {
    it('should throw a GetDataRedirect if licence-fulfilment page is false on the status', () => {
      const status = {
        [LICENCE_FULFILMENT.page]: false
      }
      const permission = { licenceLength: '12M', isRenewal: true }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if licence-confirmation page is false on the status', () => {
      const status = {
        renewal: true,
        [LICENCE_FULFILMENT.page]: true,
        [LICENCE_CONFIRMATION_METHOD.page]: false
      }
      const permission = { licenceLength: '12M', isRenewal: true }
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
            ...address
          },
          isLicenceForYou: true
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
            postcode: undefined
          },
          isLicenceForYou: true
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

    // it('should return the licence summary page uri', async () => {
    //   mockStatusCacheGet.mockImplementationOnce(() => ({
    //     renewal: false,
    //     [ADDRESS_ENTRY.page]: true,
    //     [ADDRESS_SELECT.page]: true,
    //     [CONTACT.page]: true,
    //     [LICENCE_FULFILMENT.page]: true,
    //     [LICENCE_CONFIRMATION_METHOD.page]: true
    //   }))
    //   mockTransactionCacheGet.mockImplementationOnce(() => ({
    //     licensee: {
    //       firstName: 'Graham',
    //       lastName: 'Willis',
    //       birthDate: '1946-01-01',
    //       premises: undefined,
    //       street: undefined,
    //       locality: undefined,
    //       town: undefined,
    //       postcode: undefined,
    //       isLicenceForYou: true,
    //       countryCode: 'GB'
    //     }
    //   }))
    //   const transaction = {
    //     permissions: [
    //       {
    //         licensee: {
    //           firstName: 'Graham',
    //           lastName: 'Willis',
    //           birthDate: '1946-01-01',
    //           premises: '14 Howecroft Court',
    //           street: 'Eastmead Lane',
    //           locality: 'Bristolville',
    //           town: 'Bristol',
    //           postcode: 'BS9 1HJ',
    //           countryCode: 'GB'
    //         },
    //         isLicenceForYou: true
    //       },
    //       {
    //         licensee: {
    //           firstName: 'Graham',
    //           lastName: 'Willis',
    //           birthDate: '1946-01-01',
    //           premises: undefined,
    //           street: undefined,
    //           locality: undefined,
    //           town: undefined,
    //           postcode: undefined,
    //           countryCode: undefined
    //         },
    //         isLicenceForYou: true
    //       }
    //     ],
    //     length: 2
    //   }
    //   isMultibuyForYou.mockImplementationOnce(() => true)
    //   generateRequestMock(transaction)
    //   const result = await getData(mockRequest(transaction))
    //   expect(result.uri.licenceSummary).toBe(LICENCE_SUMMARY.uri)
    // })

    it('should set the licence information based on orginal licence info if isLicenceForYou is true for both', async () => {
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
          premises: '14 Howecroft Court',
          street: 'Eastmead Lane',
          locality: 'Bristolville',
          town: 'Bristol',
          postcode: 'BS9 1HJ',
          countryCode: 'GB',
          noLicenceRequired: true,
          preferredMethodOfConfirmation: 'Email',
          email: 'name@example.com',
          text: undefined,
          preferredMethodOfReminder: 'Email',
          preferredMethodOfNewsletter: 'Prefer not to be contacted'
        },
        isLicenceForYou: true
      }))
      const transaction = {
        permissions: [
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
              noLicenceRequired: true,
              preferredMethodOfConfirmation: 'Email',
              email: 'name@example.com',
              text: undefined,
              preferredMethodOfReminder: 'Email',
              preferredMethodOfNewsletter: 'Prefer not to be contacted'
            },
            isLicenceForYou: true
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
              countryCode: undefined,
              noLicenceRequired: undefined,
              preferredMethodOfConfirmation: undefined,
              email: undefined,
              text: undefined,
              preferredMethodOfReminder: undefined,
              preferredMethodOfNewsletter: undefined
            },
            isLicenceForYou: true
          }
        ],
        length: 2
      }
      isMultibuyForYou.mockImplementationOnce(() => true)
      generateRequestMock(transaction)
      const { summaryTable } = await getData(mockRequest(transaction))
      expect(summaryTable).toMatchSnapshot()
    })
  })
})
