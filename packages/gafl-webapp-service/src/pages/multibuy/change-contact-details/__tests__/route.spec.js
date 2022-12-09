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
import { HOW_CONTACTED } from '../../../../processors/mapping-constants'
import pageRoute from '../../../../routes/page-route.js'
import { CHANGE_CONTACT_DETAILS_SEEN } from '../../../../constants.js'

jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn(() => Symbol('addLanguageCodeToUri'))
}))

jest.mock('../../../../processors/mapping-constants', () => ({
  HOW_CONTACTED: {
    email: 'Email Me',
    none: 'Please not contact moi',
    text: 'Text Me',
    post: 'By pigeon'
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

const getMockCatalog = overrides => ({
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
  yes: 'aye',
  ...overrides
})

const getMockPermission = (licenseePermissions, permissions = {}) => ({
  licenceLength: '12M',
  isLicenceForYou: true,
  ...permissions,
  licensee: {
    firstName: 'Fester',
    lastName: 'Tester',
    premises: '14 Howecroft Court',
    street: 'Eastmead Lane',
    town: 'Bristol',
    postcode: 'BS9 1HJ',
    email: 'fester@tester.com',
    mobilePhone: '01234567890',
    birthDate: '1996-01-01',
    postalFulfilment: true,
    ...licenseePermissions
  }
})

const getRequestMock = ({
  permission = getMockPermission(),
  query,
  status,
  setStatusPermission = () => {},
  catalog = getMockCatalog()
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: async () => ({
          fromSummary: false,
          [ADDRESS_ENTRY.page]: true,
          [ADDRESS_SELECT.page]: true,
          [CONTACT.page]: true,
          [LICENCE_FULFILMENT.page]: true,
          [LICENCE_CONFIRMATION_METHOD.page]: true,
          ...status
        }),
        setCurrentPermission: setStatusPermission
      },
      transaction: {
        getCurrentPermission: async () => permission
      }
    }
  }),
  i18n: {
    getCatalog: () => catalog
  },
  query,
  url: {
    search: ''
  }
})

describe('change-contact-details > route', () => {
  it('should return result of pageRoute call', () => {
    expect(route).toEqual(mockRoute)
  })

  it('should set status.fromSummary to seen', async () => {
    const mockPermission = jest.fn()
    const mockRequest = getRequestMock({ setStatusPermission: mockPermission })
    await getData(mockRequest)
    expect(mockPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        changeContactDetails: CHANGE_CONTACT_DETAILS_SEEN.SEEN
      })
    )
  })

  it.each([
    ['Review or change the licence details', true, 'change_licence_details_you'],
    ['Review or change the licence details other', false, 'change_licence_details_other']
  ])('changeLicenceDetails should be %s when isLicenceForYou is %s', async (mssg, isLicenceForYou, mssgKey) => {
    const permission = getMockPermission(
      {},
      {
        licenceLength: '1D',
        isLicenceForYou
      }
    )
    const mssgCatalog = getMockCatalog({
      [mssgKey]: mssg
    })
    const sampleRequest = getRequestMock({
      permission,
      catalog: mssgCatalog
    })
    const { changeLicenceDetails } = await getData(sampleRequest)
    expect(changeLicenceDetails).toBe(mssg)
  })

  it.each([
    ['Yaas', HOW_CONTACTED.email, 'yes'],
    ['Nnnoo, noo, noo', HOW_CONTACTED.none, 'no']
  ])('newsletter text should show as %s if how contacted is %s', async (mssg, preferredMethodOfNewsletter, mssgKey) => {
    const mssgCatalog = getMockCatalog({
      [mssgKey]: mssg
    })
    console.log('mssgcat: ', mssgCatalog.yes)
    const samplePermission = getMockPermission({
      preferredMethodOfNewsletter
    })
    const { summaryTable } = await getData(
      getRequestMock({
        permission: samplePermission,
        catalog: mssgCatalog
      })
    )
    expect(summaryTable[4].value.text).toBe(mssg)
  })

  describe('getLicenseeDetailsSummaryRows', () => {
    describe('when purchasing a 12 month (physical licence)', () => {
      it.each([
        [HOW_CONTACTED.email, HOW_CONTACTED.email, 'Yes'],
        [HOW_CONTACTED.email, HOW_CONTACTED.text, 'Yes'],
        [HOW_CONTACTED.email, HOW_CONTACTED.email, HOW_CONTACTED.none],
        [HOW_CONTACTED.email, HOW_CONTACTED.text, HOW_CONTACTED.none],
        [HOW_CONTACTED.text, HOW_CONTACTED.email, 'Yes'],
        [HOW_CONTACTED.text, HOW_CONTACTED.text, 'Yes'],
        [HOW_CONTACTED.text, HOW_CONTACTED.email, HOW_CONTACTED.none],
        [HOW_CONTACTED.text, HOW_CONTACTED.text, HOW_CONTACTED.none],
        [HOW_CONTACTED.none, HOW_CONTACTED.post, 'Yes'],
        [HOW_CONTACTED.none, HOW_CONTACTED.post, HOW_CONTACTED.none],
        [HOW_CONTACTED.none, HOW_CONTACTED.email, 'Yes'],
        [HOW_CONTACTED.none, HOW_CONTACTED.email, HOW_CONTACTED.none],
        [HOW_CONTACTED.none, HOW_CONTACTED.text, 'Yes'],
        [HOW_CONTACTED.none, HOW_CONTACTED.text, HOW_CONTACTED.none]
      ])(
        'should display the Licence as %s, Licence Confirmation as %s and Newsletter as %s for you with postal fulfilment',
        async (preferredMethodOfConfirmation, preferredMethodOfReminder, preferredMethodOfNewsletter) => {
          const samplePermission = getMockPermission({
            preferredMethodOfConfirmation,
            preferredMethodOfReminder,
            preferredMethodOfNewsletter
          })
          const { summaryTable } = await getData(getRequestMock({ permission: samplePermission }))
          expect(summaryTable).toMatchSnapshot()
        }
      )

      it.each([
        [HOW_CONTACTED.email, HOW_CONTACTED.email, 'Yes'],
        [HOW_CONTACTED.email, HOW_CONTACTED.text, 'Yes'],
        [HOW_CONTACTED.text, HOW_CONTACTED.text, 'Yes'],
        [HOW_CONTACTED.text, HOW_CONTACTED.email, 'Yes'],
        [HOW_CONTACTED.email, HOW_CONTACTED.email, HOW_CONTACTED.none],
        [HOW_CONTACTED.email, HOW_CONTACTED.text, HOW_CONTACTED.none],
        [HOW_CONTACTED.text, HOW_CONTACTED.text, HOW_CONTACTED.none],
        [HOW_CONTACTED.text, HOW_CONTACTED.email, HOW_CONTACTED.none]
      ])(
        'should display the Licence as %s, Licence Confirmation as %s and Newsletter as %s without postal fulfilment',
        async (preferredMethodOfConfirmation, preferredMethodOfReminder, preferredMethodOfNewsletter) => {
          const samplePermission = getMockPermission({
            preferredMethodOfConfirmation,
            preferredMethodOfReminder,
            preferredMethodOfNewsletter,
            postalFulfilment: false
          })
          const { summaryTable } = await getData(getRequestMock({ permission: samplePermission }))
          expect(summaryTable).toMatchSnapshot()
        }
      )

      it('should not include newsletter row in the summary table if licence is not for you', async () => {
        const samplePermission = getMockPermission({}, { isLicenceForYou: false })
        const { summaryTable } = await getData(getRequestMock({ permission: samplePermission }))
        expect(summaryTable).toMatchSnapshot()
      })
    })

    describe('when purchasing a 1 or 8 day', () => {
      it.each([
        [HOW_CONTACTED.email, 'Yes'],
        [HOW_CONTACTED.text, 'Yes'],
        [HOW_CONTACTED.none, 'Yes'],
        [HOW_CONTACTED.email, HOW_CONTACTED.none],
        [HOW_CONTACTED.text, HOW_CONTACTED.none],
        [HOW_CONTACTED.none, HOW_CONTACTED.none]
      ])('should display the Licence as %s and Newsletter as %s', async (preferredMethodOfReminder, preferredMethodOfNewsletter) => {
        const samplePermission = getMockPermission(
          {
            preferredMethodOfReminder,
            preferredMethodOfNewsletter
          },
          {
            licenceLength: '1D'
          }
        )
        const { summaryTable } = await getData(
          getRequestMock({
            permission: samplePermission
          })
        )
        expect(summaryTable).toMatchSnapshot()
      })
    })
  })

  describe('addLanguageCodeToUri', () => {
    beforeEach(jest.clearAllMocks)

    it.each([[ADDRESS_LOOKUP.uri], [LICENCE_FULFILMENT.uri], [LICENCE_CONFIRMATION_METHOD.uri], [CONTACT.uri], [NEWSLETTER.uri]])(
      'test addLanguageCodeToUri is called correctly',
      async urlToCheck => {
        const sampleRequest = getRequestMock(getMockPermission({}))
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
      const mockRequest = getRequestMock({ permission: {}, status })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(ADDRESS_LOOKUP.uri)
    })

    it('should throw a GetDataRedirect if licence-fulfilment page is false on the status', async () => {
      const status = {
        [CONTACT.page]: false
      }
      const mockRequest = getRequestMock({ permission: {}, status })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(CONTACT.uri)
    })

    it('should throw a GetDataRedirect if licence-fulfilment page is false on the status', async () => {
      const status = {
        [LICENCE_FULFILMENT.page]: false
      }
      const mockRequest = getRequestMock({ status })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(LICENCE_FULFILMENT.uri)
    })

    it('should throw a GetDataRedirect if licence-confirmation page is false on the status', async () => {
      const status = {
        [LICENCE_CONFIRMATION_METHOD.page]: false
      }
      const mockRequest = getRequestMock({ status })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(LICENCE_CONFIRMATION_METHOD.uri)
    })
  })
})
