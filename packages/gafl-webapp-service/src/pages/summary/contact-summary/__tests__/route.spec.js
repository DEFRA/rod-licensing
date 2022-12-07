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
import { isPhysical } from '../../../../processors/licence-type-display.js'

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
    email: 'e-mail',
    text: 'SMS',
    letter: 'snail mail',
    none: 'silence'
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
jest.mock('../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))

const mockRoute = Symbol('mock-route')
const { default: route } = require('../route.js')
jest.mock('../../../../routes/page-route.js', () => jest.fn(() => mockRoute))
const getData = pageRoute.mock.calls[1][4]

const generateRequestMock = ({
  permissions = [getSamplePermission()],
  query = '',
  status = {},
  setStatus = async () => {},
  setTransactionPermission = async () => {}
} = {}) => ({
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
        setCurrentPermission: setStatus
      },
      transaction: {
        get: async () => ({ permissions }),
        getCurrentPermission: async () => permissions[permissions.length - 1],
        setCurrentPermission: setTransactionPermission
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

const getSamplePermission = (licenseeOverrides = {}, overrides = {}) => ({
  isLicenceForYou: false,
  licenceLength: '12M',
  licensee: {
    firstName: 'Brenin',
    lastName: 'Pysgotwr',
    birthDate: '1987-10-12',
    premises: '14 Howecroft Court',
    street: 'Eastmead Lane',
    town: 'Bristol',
    postcode: 'BS9 1HJ',
    countryCode: 'GB',
    mobilePhone: '01234567890',
    email: 'brenin@example.com',
    postalFulfilment: true,
    preferredMethodOfConfirmation: HOW_CONTACTED.email,
    preferredMethodOfReminder: HOW_CONTACTED.email,
    preferredMethodOfNewsletter: HOW_CONTACTED.none,
    ...licenseeOverrides
  },
  ...overrides
})
const getSamplePermissionForYou = (licenseeOverrides = {}, overrides = {}) =>
  getSamplePermission({ ...licenseeOverrides }, { isLicenceForYou: true, ...overrides })

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
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermission({
              preferredMethodOfConfirmation: HOW_CONTACTED.text,
              preferredMethodOfReminder: HOW_CONTACTED.text,
              mobilePhone: '07700900900',
              preferredMethodOfNewsletter: HOW_CONTACTED.email
            })
          ]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Licence as post, Licence Confirmation as note of licence and Contact as post', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermission({
              preferredMethodOfConfirmation: HOW_CONTACTED.none,
              preferredMethodOfReminder: 'Letter'
            })
          ]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })
    })

    describe('when purchasing a 12 month (physical licence) without postal fulfilment', () => {
      it('should display the Licence and Contact as the email and Newsletter as no', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermission({
              postalFulfilment: false
            })
          ]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Licence and Contact as the phone number and Newsletter as yes', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermission({
              postalFulfilment: false,
              preferredMethodOfConfirmation: HOW_CONTACTED.text,
              preferredMethodOfReminder: HOW_CONTACTED.text,
              mobilePhone: '07700900900',
              preferredMethodOfNewsletter: HOW_CONTACTED.email
            })
          ]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })
    })

    describe('when purchasing a 1 day (non physical licence)', () => {
      beforeAll(() => {
        isPhysical.mockReturnValue(false)
      })

      afterAll(() => {
        isPhysical.mockReturnValue(true)
      })

      it('should display the Contact as the email and Newsletter as no', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [getSamplePermission({}, { licenceLength: '1D' })]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Contact as the phone number and Newsletter as yes', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermission(
              {
                postalFulfilment: false,
                preferredMethodOfConfirmation: HOW_CONTACTED.text,
                preferredMethodOfReminder: HOW_CONTACTED.text,
                mobilePhone: '07700900900',
                preferredMethodOfNewsletter: HOW_CONTACTED.email
              },
              { licenceLength: '1D' }
            )
          ]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should display the Contact as Make a note on confirmation', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermission(
              {
                postalFulfilment: false,
                preferredMethodOfConfirmation: HOW_CONTACTED.none,
                preferredMethodOfReminder: HOW_CONTACTED.none,
                preferredMethodOfNewsletter: HOW_CONTACTED.email
              },
              { licenceLength: '1D' }
            )
          ]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should have the newsletter is set have preferred method and if isLicenceForYou is true', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermissionForYou(
              {
                postalFulfilment: false,
                preferredMethodOfConfirmation: HOW_CONTACTED.none,
                preferredMethodOfReminder: HOW_CONTACTED.none,
                preferredMethodOfNewsletter: HOW_CONTACTED.email
              },
              { licenceLength: '1D' }
            )
          ]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should have the newsletter set to no if have preferred method and if isLicenceForYou is true', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermissionForYou(
              {
                postalFulfilment: false,
                preferredMethodOfConfirmation: HOW_CONTACTED.none,
                preferredMethodOfReminder: HOW_CONTACTED.none,
                preferredMethodOfNewsletter: HOW_CONTACTED.none
              },
              { licenceLength: '1D' }
            )
          ]
        })
        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })

      it('should not have the newsletter row if isLicenceForYou is false', async () => {
        const sampleRequest = generateRequestMock({
          permissions: [
            getSamplePermission(
              {
                preferredMethodOfConfirmation: HOW_CONTACTED.text,
                preferredMethodOfReminder: HOW_CONTACTED.text
              },
              { licenceLength: '1D' }
            )
          ]
        })

        const { summaryTable } = await getData(sampleRequest)

        expect(summaryTable).toMatchSnapshot()
      })
    })

    it.each([[true], [false]])('returns value of isLicenceForYou if licence is "%s"', async licenceFor => {
      const sampleRequest = generateRequestMock({ permissions: [getSamplePermission({}, { isLicenceForYou: licenceFor })] })

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

          const sampleRequest = generateRequestMock({ permissions: [permission] })

          await getData(sampleRequest)

          expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, urlToCheck)
        }
      )
    })
  })

  describe.each([
    ['licence fulfilment', { [LICENCE_FULFILMENT.page]: false }, LICENCE_FULFILMENT.uri],
    ['licence confirmation', { [LICENCE_CONFIRMATION_METHOD.page]: false }, LICENCE_CONFIRMATION_METHOD.uri],
    ['address entry and address select', { renewal: false, [ADDRESS_ENTRY.page]: false, [ADDRESS_SELECT.page]: false }, ADDRESS_LOOKUP.uri],
    ['contact', { renewal: false, [ADDRESS_ENTRY.page]: true, [ADDRESS_SELECT.page]: true, [CONTACT.page]: false }, CONTACT.uri]
  ])('checkNavigation', (pageName, status, redirectUri) => {
    it(`should throw a GetDataRediect if ${pageName} hasn't been visited and it's not a multibuy`, async () => {
      const permission = { licenceLength: '12M', isRenewal: status.renewal !== undefined ? status.renewal : true, licensee: {} }
      const mockRequest = generateRequestMock({ permissions: [permission], status })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(redirectUri)
    })

    it(`doesn't throw an error if IsMultibuyForYou evaluates to true (as ${pageName} page is intentionally skipped)`, async () => {
      isMultibuyForYou.mockImplementationOnce(() => true)
      const permission = { licenceLength: '12M', isRenewal: false, licensee: {} }
      const mockRequest = generateRequestMock({ permissions: [getSamplePermissionForYou(), permission], status })
      let error

      try {
        await getData(mockRequest)
      } catch (e) {
        error = e
      }

      expect(error).toBeUndefined()
    })
  })

  it.each([
    ['address entry and address select', { renewal: true, [ADDRESS_ENTRY.page]: false, [ADDRESS_SELECT.page]: false }],
    ['contact', { renewal: true, [ADDRESS_ENTRY.page]: true, [ADDRESS_SELECT.page]: true, [CONTACT.page]: false }]
  ])("doesn't check for %s page being visited if permission is a renewal", async (_page, status) => {
    const mockRequest = generateRequestMock({
      permissions: [getSamplePermission({}, { isRenewal: true })],
      status
    })
    let error

    try {
      await getData(mockRequest)
    } catch (e) {
      error = e
    }

    expect(error).toBeUndefined()
  })

  it.each([
    ['licence fulfilment', { [LICENCE_FULFILMENT.page]: false }],
    ['licence confirmation', { [LICENCE_CONFIRMATION_METHOD.page]: false }]
  ])("doesn't check for %s page being visited if permission isn't physical", async (_page, status) => {
    isPhysical.mockReturnValueOnce(false)
    const mockRequest = generateRequestMock({
      status
    })
    let error

    try {
      await getData(mockRequest)
    } catch (e) {
      error = e
    }

    expect(error).toBeUndefined()
  })

  describe('getData', () => {
    it('should return the licence summary page uri', async () => {
      const {
        uri: { licenceSummary }
      } = await getData(generateRequestMock())
      expect(licenceSummary).toBe(LICENCE_SUMMARY.uri)
    })
  })

  describe('Transfer properties to multibuy licence', () => {
    beforeEach(() => {
      isMultibuyForYou.mockImplementationOnce(() => true)
    })

    it('copies licensee from existing permission to new permission ', async () => {
      const completedPermission = getSamplePermissionForYou()
      const newPermission = { isLicenceForYou: true, licensee: {} }
      const { licensee } = completedPermission

      await getData(generateRequestMock({ permissions: [completedPermission, newPermission] }))

      expect(newPermission.licensee).toEqual({ ...licensee })
    })

    it('copies, rather than clones, permission licensee', async () => {
      const completedPermission = getSamplePermissionForYou()
      const newPermission = { isLicenceForYou: true, licensee: {} }
      const { licensee } = completedPermission

      await getData(generateRequestMock({ permissions: [completedPermission, newPermission] }))

      expect(newPermission.licensee).not.toBe(licensee)
    })

    it.each([ADDRESS_ENTRY.page, ADDRESS_SELECT.page, CONTACT.page, LICENCE_CONFIRMATION_METHOD.page])(
      'marks previous pages as having been completed',
      async pageToSkip => {
        const setStatus = jest.fn()
        const mockRequest = generateRequestMock({
          permissions: [getSamplePermissionForYou(), { isLicenceForYou: true, licensee: {} }],
          status: { [pageToSkip]: false },
          setStatus
        })

        await getData(mockRequest)
        expect(setStatus).toHaveBeenCalledWith(
          expect.objectContaining({
            [pageToSkip]: true
          })
        )
      }
    )

    it('persists the new permission in the transaction cache', async () => {
      const newPermission = { isLicenceForYou: true, licensee: {} }
      const setTransactionPermission = jest.fn()

      await getData(
        generateRequestMock({
          permissions: [getSamplePermissionForYou(), newPermission],
          setTransactionPermission
        })
      )

      expect(setTransactionPermission).toHaveBeenCalledWith(newPermission)
    })
  })
})
