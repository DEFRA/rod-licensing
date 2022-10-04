import { getLicenseeDetailsSummaryRows, checkNavigation } from '../route'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { ADDRESS_LOOKUP, CONTACT, LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD, NEWSLETTER } from '../../../../uri.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

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
  i18n: {
    getCatalog: () => ({
      contact_summary_title: Symbol('contact_summary_title'),
      contact_summary_row_address: Symbol('contact_summary_row_address'),
      contact_summary_row_licence: Symbol('contact_summary_row_licence'),
      contact_summary_row_licence_conf: Symbol('contact_summary_row_licence_conf'),
      contact_summary_row_contact: Symbol('contact_summary_row_contact'),
      contact_summary_row_licence_details: Symbol('contact_summary_row_licence_details'),
      contact_summary_row_newsletter: Symbol('contact_summary_row_newsletter'),
      contact_summary_email: Symbol('contact_summary_email'),
      contact_summary_text_sngl: Symbol('contact_summary_text_sngl'),
      contact_summary_text_plrl: Symbol('contact_summary_text_plrl'),
      contact_summary_license_default: Symbol('contact_summary_license_default'),
      contact_summary_license_non_physical: Symbol('contact_summary_license_non_physical'),
      contact_summary_license_physical: Symbol('contact_summary_license_physical')
    })
  },
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

          const mockRequest = generateRequestMock()

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
        [LICENCE_CONFIRMATION_METHOD.page]: false
      }
      const permission = { licenceLength: '12M', isRenewal: true }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })
  })
})
