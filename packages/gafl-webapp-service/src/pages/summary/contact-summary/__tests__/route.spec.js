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
import { CONTACT_SUMMARY_SEEN } from '../../../../constants.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'

jest.mock('../../../../processors/refdata-helper.js', () => ({
  countries: {
    nameFromCode: () => 'United Kingdom'
  }
}))

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

const mockDecoratedUri = Symbol('addLanguageCodeToUri')
jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn(() => mockDecoratedUri)
}))

jest.mock('../../../../processors/mapping-constants', () => ({
  HOW_CONTACTED: {
    email: 'e-mail',
    text: 'SMS',
    letter: 'snail mail',
    none: 'silence'
  }
}))

jest.mock('../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
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

const getRequestMock = ({
  permissions = [getSamplePermission()],
  query,
  status,
  setStatus = async () => {},
  setTransactionPermission = async () => {},
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
    getCatalog: () => catalog
  },
  query,
  url: {
    search: ''
  }
})

const getSamplePermission = (licenseeOverrides = {}, overrides = {}) => ({
  isLicenceForYou: true,
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

  it('should set status.fromSummary to seen', async () => {
    const mockPermission = jest.fn()
    const mockRequest = getRequestMock({ setStatus: mockPermission })
    await getData(mockRequest)
    expect(mockPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        fromSummary: CONTACT_SUMMARY_SEEN
      })
    )
  })

  it.each([
    ['Review or change the licence details', true, 'change_licence_details_you', Symbol('Review or change the licence details')],
    [
      'Review or change the licence details other',
      false,
      'change_licence_details_other',
      Symbol('Review or change the licence details other')
    ]
  ])('changeLicenceDetails should be %s when isLicenceForYou is %s', async (mssg, isLicenceForYou, mssgKey) => {
    const mssgCatalog = getMockCatalog({
      [mssgKey]: mssg
    })
    const sampleRequest = getRequestMock({
      permissions: [
        getSamplePermission(
          {},
          {
            licenceLength: '1D',
            isLicenceForYou
          }
        )
      ],
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
    const { summaryTable } = await getData(
      getRequestMock({
        permissions: [
          getSamplePermission({
            preferredMethodOfNewsletter
          })
        ],
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
          const { summaryTable } = await getData(
            getRequestMock({
              permissions: [
                getSamplePermission({
                  preferredMethodOfConfirmation,
                  preferredMethodOfReminder,
                  preferredMethodOfNewsletter
                })
              ]
            })
          )
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
          const { summaryTable } = await getData(
            getRequestMock({
              permissions: [
                getSamplePermission({
                  preferredMethodOfConfirmation,
                  preferredMethodOfReminder,
                  preferredMethodOfNewsletter,
                  postalFulfilment: false
                })
              ]
            })
          )
          expect(summaryTable).toMatchSnapshot()
        }
      )

      it('should not include newsletter row in the summary table if licence is not for you', async () => {
        const { summaryTable } = await getData(getRequestMock({ permissions: [getSamplePermission({}, { isLicenceForYou: false })] }))
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
        isPhysical.mockReturnValueOnce(false).mockReturnValueOnce(false)
        const { summaryTable } = await getData(
          getRequestMock({
            permissions: [
              getSamplePermission(
                {
                  preferredMethodOfReminder,
                  preferredMethodOfNewsletter
                },
                {
                  licenceLength: '1D',
                  isLicenceForYou: true
                }
              )
            ]
          })
        )
        expect(summaryTable).toMatchSnapshot()
      })
    })

    it('should not have the newsletter row if isLicenceForYou is false', async () => {
      const sampleRequest = getRequestMock({
        permissions: [
          getSamplePermission(
            {
              preferredMethodOfConfirmation: HOW_CONTACTED.text,
              preferredMethodOfReminder: HOW_CONTACTED.text
            },
            { licenceLength: '1D', isLicenceForYou: false }
          )
        ]
      })
      const { summaryTable } = await getData(sampleRequest)
      expect(summaryTable).toMatchSnapshot()
    })

    it.each([[true], [false]])('returns value of isLicenceForYou if licence is "%s"', async licenceFor => {
      const sampleRequest = getRequestMock({ permissions: [getSamplePermission({}, { isLicenceForYou: licenceFor })] })

      const { changeLicenceDetails } = await getData(sampleRequest)

      expect(changeLicenceDetails).toMatchSnapshot()
    })
  })

  describe('addLanguageCodeToUri', () => {
    beforeEach(jest.clearAllMocks)

    it.each([
      [ADDRESS_LOOKUP.uri],
      [LICENCE_FULFILMENT.uri],
      [LICENCE_CONFIRMATION_METHOD.uri],
      [CONTACT.uri],
      [NEWSLETTER.uri],
      [LICENCE_SUMMARY.uri]
    ])('test addLanguageCodeToUri is called correctly', async urlToCheck => {
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

      const sampleRequest = getRequestMock({ permissions: [permission] })

      await getData(sampleRequest)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, urlToCheck)
    })

    it('uses url modified by addLanguageCode for licenceSummary', async () => {
      const decoratedUri = Symbol('decoratedUri')
      addLanguageCodeToUri.mockReturnValue(decoratedUri)

      const {
        uri: { licenceSummary }
      } = await getData(getRequestMock())

      expect(licenceSummary).toBe(decoratedUri)

      addLanguageCodeToUri.mockReturnValue(mockDecoratedUri)
    })
  })
  describe('checkNavigation', () => {
    describe.each([
      ['licence fulfilment', { [LICENCE_FULFILMENT.page]: false }, LICENCE_FULFILMENT.uri],
      ['licence confirmation', { [LICENCE_CONFIRMATION_METHOD.page]: false }, LICENCE_CONFIRMATION_METHOD.uri],
      [
        'address entry and address select',
        { renewal: false, [ADDRESS_ENTRY.page]: false, [ADDRESS_SELECT.page]: false },
        ADDRESS_LOOKUP.uri
      ],
      ['contact', { renewal: false, [ADDRESS_ENTRY.page]: true, [ADDRESS_SELECT.page]: true, [CONTACT.page]: false }, CONTACT.uri]
    ])('checkNavigation', (pageName, status, redirectUri) => {
      it(`should throw a GetDataRediect if ${pageName} hasn't been visited and it's not a multibuy`, async () => {
        const permission = { licenceLength: '12M', isRenewal: status.renewal !== undefined ? status.renewal : true, licensee: {} }
        const mockRequest = getRequestMock({ permissions: [permission], status })
        await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(redirectUri)
      })

      it(`doesn't throw an error if IsMultibuyForYou evaluates to true (as ${pageName} page is intentionally skipped)`, async () => {
        isMultibuyForYou.mockImplementationOnce(() => true)
        const permission = { licenceLength: '12M', isRenewal: false, licensee: {} }
        const mockRequest = getRequestMock({ permissions: [getSamplePermissionForYou(), permission], status })
        let error

        try {
          await getData(mockRequest)
        } catch (e) {
          error = e
        }

        expect(error).toBeUndefined()
      })
    })

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

    it.each([
      ['address entry and address select', { renewal: true, [ADDRESS_ENTRY.page]: false, [ADDRESS_SELECT.page]: false }],
      ['contact', { renewal: true, [ADDRESS_ENTRY.page]: true, [ADDRESS_SELECT.page]: true, [CONTACT.page]: false }]
    ])("doesn't check for %s page being visited if permission is a renewal", async (_page, status) => {
      const mockRequest = getRequestMock({
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
      ['address entry and address select', { renewal: true, [ADDRESS_ENTRY.page]: false, [ADDRESS_SELECT.page]: false }],
      ['contact', { renewal: true, [ADDRESS_ENTRY.page]: true, [ADDRESS_SELECT.page]: true, [CONTACT.page]: false }]
    ])("doesn't check for %s page being visited if permission is a renewal", async (_page, status) => {
      const mockRequest = getRequestMock({
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

    await getData(getRequestMock({ permissions: [completedPermission, newPermission] }))

    expect(newPermission.licensee).toEqual({ ...licensee })
  })

  it('copies, rather than clones, permission licensee', async () => {
    const completedPermission = getSamplePermissionForYou()
    const newPermission = { isLicenceForYou: true, licensee: {} }
    const { licensee } = completedPermission

    await getData(getRequestMock({ permissions: [completedPermission, newPermission] }))

    expect(newPermission.licensee).not.toBe(licensee)
  })

  it('persists the new permission in the transaction cache', async () => {
    const newPermission = { isLicenceForYou: true, licensee: {} }
    const setTransactionPermission = jest.fn()

    await getData(
      getRequestMock({
        permissions: [getSamplePermissionForYou(), newPermission],
        setTransactionPermission
      })
    )

    expect(setTransactionPermission).toHaveBeenCalledWith(newPermission)
  })

  it.each([ADDRESS_ENTRY.page, ADDRESS_SELECT.page, CONTACT.page, LICENCE_CONFIRMATION_METHOD.page])(
    'marks previous pages as having been completed',
    async pageToSkip => {
      const setStatus = jest.fn()
      const mockRequest = getRequestMock({
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
})
