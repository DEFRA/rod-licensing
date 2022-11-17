import {
  ADDRESS_ENTRY,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  CONTACT,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  NEWSLETTER
} from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import pageRoute from '../../../../routes/page-route.js'

jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn(() => Symbol('addLanguageCodeToUri'))
}))

jest.mock('../../../../processors/mapping-constants', () => ({
  HOW_CONTACTED: {
    email: 'Email',
    none: 'Prefer not to be contacted',
    text: 'Text'
  }
}))

jest.mock('../../../../processors/refdata-helper.js', () => ({
  countries: {
    nameFromCode: async () => 'GB'
  }
}))

const mockRoute = Symbol('mock-route')
const route = require('../route.js').default
jest.mock('../../../../routes/page-route.js', () => jest.fn(() => mockRoute))
const getData = pageRoute.mock.calls[1][4]

const addressAndContact = {
  firstName: 'Fester',
  lastName: 'Tester',
  premises: '14 Howecroft Court',
  street: 'Eastmead Lane',
  town: 'Bristol',
  postcode: 'BS9 1HJ',
  email: 'fester@tester.com',
  mobilePhone: '01234567890'
}

const generateRequestMock = (permission, query, status = {}) => ({
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
      change_licence_details_other: Symbol('Review or change the licence details other'),
      change_licence_details_you: Symbol('Review or change the licence details'),
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

describe('contact-summary > route', () => {
  it('should return result of pageRoute call', () => {
    expect(route).toEqual(mockRoute)
  })

  describe('getLicenseeDetailsSummaryRows', () => {
    describe('when purchasing a 12 month (physical licence)', () => {
      it.each([
        ['Email', 'Email', 'Yes'],
        ['Email', 'Text', 'Yes'],
        ['Email', 'Email', 'Prefer not to be contacted'],
        ['Email', 'Text', 'Prefer not to be contacted'],
        ['Text', 'Email', 'Yes'],
        ['Text', 'Text', 'Yes'],
        ['Text', 'Email', 'Prefer not to be contacted'],
        ['Text', 'Text', 'Prefer not to be contacted'],
        ['Prefer not to be contacted', 'Letter', 'Prefer not to be contacted'],
        ['Prefer not to be contacted', 'Letter', 'Prefer not to be contacted'],
        ['Prefer not to be contacted', 'Letter', 'Prefer not to be contacted']
      ])(
        'should display the Licence as %s, Licence Confirmation as %s and Newsletter as %s for you with postal fulfilment',
        async (preferredMethodOfConfirmation, preferredMethodOfReminder, preferredMethodOfNewsletter) => {
          const permission = {
            licenceLength: '12M',
            isLicenceForYou: true,
            licensee: {
              ...addressAndContact,
              postalFulfilment: true,
              preferredMethodOfConfirmation,
              preferredMethodOfReminder,
              email: 'new3@example.com',
              preferredMethodOfNewsletter
            }
          }

          const sampleRequest = generateRequestMock(permission)

          const { summaryTable } = await getData(sampleRequest)

          expect(summaryTable).toMatchSnapshot()
        }
      )

      it.each([
        ['Email', 'Email', 'Yes'],
        ['Email', 'Text', 'Yes'],
        ['Text', 'Text', 'Yes'],
        ['Text', 'Email', 'Yes'],
        ['Email', 'Email', 'Prefer not to be contacted'],
        ['Email', 'Text', 'Prefer not to be contacted'],
        ['Text', 'Text', 'Prefer not to be contacted'],
        ['Text', 'Email', 'Prefer not to be contacted']
      ])(
        'should display the Licence as %s, Licence Confirmation as %s and Newsletter as %s',
        async (preferredMethodOfConfirmation, preferredMethodOfReminder, preferredMethodOfNewsletter) => {
          const permission = {
            licenceLength: '12M',
            isLicenceForYou: true,
            licensee: {
              ...addressAndContact,
              postalFulfilment: false,
              preferredMethodOfConfirmation,
              preferredMethodOfReminder,
              email: 'new3@example.com',
              preferredMethodOfNewsletter
            }
          }
          const sampleRequest = generateRequestMock(permission)

          const { summaryTable } = await getData(sampleRequest)

          expect(summaryTable).toMatchSnapshot()
        }
      )

      it('should not include newsletter option if buying for someone else', async () => {
        const permission = {
          licenceLength: '12M',
          isLicenceForYou: false,
          licensee: {
            ...addressAndContact,
            postalFulfilment: true,
            preferredMethodOfConfirmation: 'email',
            preferredMethodOfReminder: 'email',
            email: 'new3@example.com'
          }
        }

        const sampleRequest = generateRequestMock(permission)

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })
    })

    describe('when purchasing a 1 or 8 day', () => {
      it.each([
        ['Email', 'Yes'],
        ['Email', 'Yes'],
        ['Text', 'Yes'],
        ['Text', 'Yes'],
        ['Email', 'Prefer not to be contacted'],
        ['Email', 'Prefer not to be contacted'],
        ['Text', 'Prefer not to be contacted'],
        ['Text', 'Prefer not to be contacted'],
        ['Prefer not to be contacted', 'Yes'],
        ['Prefer not to be contacted', 'Prefer not to be contacted']
      ])(
        'should display the Licence as %s, Licence Confirmation as %s and Newsletter as %s',
        async (preferredMethodOfConfirmation, preferredMethodOfNewsletter) => {
          const permission = {
            licenceLength: '1D',
            isLicenceForYou: true,
            licensee: {
              ...addressAndContact,
              preferredMethodOfConfirmation,
              preferredMethodOfNewsletter
            }
          }
          const sampleRequest = generateRequestMock(permission)

          const { summaryTable } = await getData(sampleRequest)

          expect(summaryTable).toMatchSnapshot()
        }
      )
    })
  })

  it.each([[true], [false]])('returns value of isLicenceForYou if licence is "%s"', async licenceFor => {
    const permission = {
      licenceLength: '1D',
      licensee: {
        ...addressAndContact
      },
      isLicenceForYou: licenceFor
    }
    const sampleRequest = generateRequestMock(permission)

    const { changeLicenceDetails } = await getData(sampleRequest)

    expect(changeLicenceDetails).toMatchSnapshot()
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

  describe('checkNavigation', () => {
    it('should throw a GetDataRedirect if licence-fulfilment page is false on the status', async () => {
      const status = {
        [ADDRESS_ENTRY.page]: false,
        [ADDRESS_SELECT.page]: false
      }
      const permission = { licenceLength: '12M', isRenewal: false, licensee: {} }
      const mockRequest = generateRequestMock(permission, '', status)

      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(ADDRESS_LOOKUP.uri)
    })

    it('should throw a GetDataRedirect if licence-fulfilment page is false on the status', async () => {
      const status = {
        [CONTACT.page]: false
      }
      const permission = { licenceLength: '12M', isRenewal: false, licensee: {} }
      const mockRequest = generateRequestMock(permission, '', status)

      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(CONTACT.uri)
    })

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
        [LICENCE_CONFIRMATION_METHOD.page]: false
      }
      const permission = { licenceLength: '12M', isRenewal: true, licensee: {} }
      const mockRequest = generateRequestMock(permission, '', status)

      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(LICENCE_CONFIRMATION_METHOD.uri)
    })
  })
})
