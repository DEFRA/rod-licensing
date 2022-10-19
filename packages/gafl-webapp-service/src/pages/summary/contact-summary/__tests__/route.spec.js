import {
  ADDRESS_ENTRY,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  CONTACT,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  LICENCE_SUMMARY,
  NEWSLETTER
} from '../../../../uri.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'
import '../../../../processors/refdata-helper.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import pageRoute from '../../../../routes/page-route.js'

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

jest.mock('../../../../processors/refdata-helper.js', () => ({
  countries: {
    nameFromCode: async () => 'GB'
  }
}))

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn(() => false)
}))

const mockRoute = Symbol('mock-route')
const { default: route } = require('../route.js')
jest.mock('../../../../routes/page-route.js', () => jest.fn(() => mockRoute))
const getData = pageRoute.mock.calls[1][4]

const generateRequestMock = (permission = getSamplePermission(), query = '', status = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: async () => ({
          [ADDRESS_ENTRY.page]: true,
          [ADDRESS_SELECT.page]: true,
          [CONTACT.page]: true,
          [LICENCE_FULFILMENT.page]: true,
          [LICENCE_CONFIRMATION_METHOD.page]: true,
          ...status
        }),
        setCurrentPermission: () => {}
      },
      transaction: {
        getCurrentPermission: async () => permission
      }
    }
  }),
  i18n: {
    getCatalog: () => ({
      contact_summary_change: 'contact-summary-change',
      contact_summary_email: 'contact-summary-email',
      contact_summary_hidden_address: Symbol('contact-summary-hidden-address'),
      contact_summary_hidden_licence_fulfilment: Symbol('contact-summary-hidden-licence-fulfilment'),
      contact_summary_hidden_licence_confirmation: Symbol('contact-summary-hidden-licence-confirmation'),
      contact_summary_hidden_contact: Symbol('contact-summary-hidden-contact'),
      contact_summary_hidden_newsletter: Symbol('contact-summary-hidden-newsletter'),
      contact_summary_license_default: 'contact-summary-license-default',
      contact_summary_license_non_physical: 'contact-summary-license-non-physical',
      contact_summary_license_physical: 'contact-summary-license-physical',
      contact_summary_row_address: Symbol('contact-summary-row-address'),
      contact_summary_row_licence: Symbol('contact-summary-row-licence'),
      contact_summary_row_licence_conf: Symbol('contact-summary-row-licence-conf'),
      contact_summary_row_contact: Symbol('contact-summary-row-contact'),
      contact_summary_row_licence_details: Symbol('contact-summary-row-licence-details'),
      contact_summary_row_newsletter: Symbol('contact-summary-row-newsletter'),
      contact_summary_text_sngl: 'contact-summary-text-sngl',
      contact_summary_text_plrl: 'contact-summary-text-plrl',
      contact_summary_title: Symbol('contact-summary-title'),
      no: 'negative, Ghost Rider',
      yes: 'aye'
    })
  },
  query,
  url: {
    search: ''
  }
})

const getSamplePermission = (licenseeOverrides = {}, overrides = {}) => ({
  isLicenceForYou: false,
  licenceLength: '12M',
  licensee: {
    firstName: 'Brenin',
    lastName: 'Pysgotwr',
    premises: '14 Howecroft Court',
    street: 'Eastmead Lane',
    town: 'Bristol',
    postcode: 'BS9 1HJ',
    mobilePhone: '01234567890',
    email: 'brenin@example.com',
    postalFulfilment: true,
    preferredMethodOfConfirmation: 'Email',
    preferredMethodOfReminder: 'Email',
    preferredMethodOfNewsletter: 'Prefer not to be contacted',
    ...licenseeOverrides
  },
  ...overrides
})

describe('contact-summary > route', () => {
  it('should return result of pageRoute call', () => {
    expect(route).toEqual(mockRoute)
  })

  describe('getLicenseeDetailsSummaryRows', () => {
    describe('when purchasing a 12 month (physical licence) with postal fulfilment', () => {
      it('should display the Licence as post, Licence Confirmation and Contact as the email and Newsletter as no', async () => {
        const sampleRequest = generateRequestMock()

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Licence as post, Licence Confirmation and Contact as the phone number and Newsletter as yes', async () => {
        const sampleRequest = generateRequestMock(
          getSamplePermission({
            preferredMethodOfConfirmation: 'Text',
            preferredMethodOfReminder: 'Text',
            mobilePhone: '07700900900',
            preferredMethodOfNewsletter: 'Yes'
          })
        )

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Licence as post, Licence Confirmation as note of licence and Contact as post', async () => {
        const sampleRequest = generateRequestMock(
          getSamplePermission({
            preferredMethodOfConfirmation: 'Prefer not to be contacted',
            preferredMethodOfReminder: 'Letter'
          })
        )

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })
    })

    describe('when purchasing a 12 month (physical licence) without postal fulfilment', () => {
      it('should display the Licence and Contact as the email and Newsletter as no', async () => {
        const sampleRequest = generateRequestMock(
          getSamplePermission({
            postalFulfilment: false
          })
        )

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Licence and Contact as the phone number and Newsletter as yes', async () => {
        const sampleRequest = generateRequestMock(
          getSamplePermission({
            postalFulfilment: false,
            preferredMethodOfConfirmation: 'Text',
            preferredMethodOfReminder: 'Text',
            mobilePhone: '07700900900',
            preferredMethodOfNewsletter: 'Text'
          })
        )

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })
    })

    describe('when purchasing a 1 day (non physical licence)', () => {
      it('should display the Contact as the email and Newsletter as no', async () => {
        const sampleRequest = generateRequestMock(
          getSamplePermission(
            {},
            {
              licenceLength: '1D'
            }
          )
        )

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Contact as the phone number and Newsletter as yes', async () => {
        const sampleRequest = generateRequestMock(
          getSamplePermission(
            {
              postalFulfilment: false,
              preferredMethodOfConfirmation: 'Text',
              preferredMethodOfReminder: 'Text',
              mobilePhone: '07700900900',
              preferredMethodOfNewsletter: 'Yes'
            },
            {
              licenceLength: '1D'
            }
          )
        )

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Contact as Make a note on confirmation', async () => {
        const sampleRequest = generateRequestMock(
          getSamplePermission(
            {
              licenceLength: '1D'
            },
            {
              postalFulfilment: false,
              preferredMethodOfConfirmation: 'Prefer not to be contacted',
              preferredMethodOfReminder: 'Prefer not to be contacted',
              preferredMethodOfNewsletter: 'Yes'
            }
          )
        )

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })
    })

    it('should have the newsletter is set have preferred method and if isLicenceForYou is true', async () => {
      const sampleRequest = generateRequestMock(
        getSamplePermission(
          {
            postalFulfilment: false,
            preferredMethodOfConfirmation: 'Prefer not to be contacted',
            preferredMethodOfReminder: 'Prefer not to be contacted',
            preferredMethodOfNewsletter: 'Email'
          },
          { licenceLength: '1D', isLicenceForYou: true }
        ),
        {
          [HOW_CONTACTED.email]: 'Email'
        }
      )

      const { summaryTable } = await getData(sampleRequest)

      expect(summaryTable).toMatchSnapshot()
    })

    it('should have the newsletter set to no if have preferred method and if isLicenceForYou is true', async () => {
      const sampleRequest = generateRequestMock(
        getSamplePermission(
          {
            postalFulfilment: false,
            preferredMethodOfConfirmation: 'Prefer not to be contacted',
            preferredMethodOfReminder: 'Prefer not to be contacted',
            preferredMethodOfNewsletter: 'Prefer not to be contacted'
          },
          { licenceLength: '1D', isLicenceForYou: true }
        ),
        {
          [HOW_CONTACTED.email]: 'Prefer not to be contacted'
        }
      )
      const { summaryTable } = await getData(sampleRequest)

      expect(summaryTable).toMatchSnapshot()
    })

    it('should not have the newsletter row if isLicenceForYou is false', async () => {
      const sampleRequest = generateRequestMock(getSamplePermission({}, { licenceLength: '1D' }))

      const { summaryTable } = await getData(sampleRequest)

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

          const sampleRequest = generateRequestMock(permission)

          await getData(sampleRequest)

          expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, urlToCheck)
        }
      )
    })
  })

  describe('checkNavigation', () => {
    it('should throw a GetDataRedirect if licence-fulfilment page is false on the status', async () => {
      const status = {
        [LICENCE_FULFILMENT.page]: false
      }
      const permission = { licenceLength: '12M', isRenewal: true, licensee: {} }
      const mockRequest = generateRequestMock(permission, '', status)

      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(LICENCE_FULFILMENT.uri)
    })

    it('should throw a GetDataRedirect if licence-confirmation page is false on the status', async () => {
      const status = {
        renewal: true,
        [LICENCE_FULFILMENT.page]: true,
        [LICENCE_CONFIRMATION_METHOD.page]: false
      }
      const permission = { licenceLength: '12M', isRenewal: true, licensee: {} }
      const mockRequest = generateRequestMock(permission, '', status)

      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(LICENCE_CONFIRMATION_METHOD.uri)
    })

    it('should throw a GetDataRedirect if address entry and address select page is false on the status', async () => {
      const status = {
        renewal: false,
        [ADDRESS_ENTRY.page]: false,
        [ADDRESS_SELECT.page]: false
      }
      const permission = { licenceLength: '12M' }
      const mockRequest = generateRequestMock(permission, '', status)
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(ADDRESS_LOOKUP.uri)
    })

    it('should throw a GetDataRedirect if contact page is false on the status', async () => {
      const status = {
        renewal: false,
        [ADDRESS_ENTRY.page]: true,
        [ADDRESS_SELECT.page]: true,
        [CONTACT.page]: false
      }
      const permission = { licenceLength: '12M' }
      const mockRequest = generateRequestMock(permission, '', status)
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(CONTACT.uri)
    })
  })

  describe('getData', () => {
    it('should return the licence summary page uri', async () => {
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = await getData(generateRequestMock(getSamplePermission()))
      expect(result.uri.licenceSummary).toBe(LICENCE_SUMMARY.uri)
    })
  })
})
