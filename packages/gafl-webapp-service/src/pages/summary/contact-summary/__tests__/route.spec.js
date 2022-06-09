import { getLicenseeDetailsSummaryRows, checkNavigation, getData, getContactDetails, getContactText } from '../route'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD, ADDRESS_ENTRY, CONTACT, ADDRESS_SELECT, ADDRESS_LOOKUP, NEWSLETTER } from '../../../../uri.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'

const address = {
  firstName: 'Fester',
  lastName: 'Tester',
  premises: '14 Howecroft Court',
  street: 'Eastmead Lane',
  town: 'Bristol',
  postcode: 'BS9 1HJ'
}

jest.mock('../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))
const mockStatusCacheGet = jest.fn()
const mocktransactionCacheGet = jest.fn()

const getMockRequest = () => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: mockStatusCacheGet,
      },
      transaction: {
        getCurrentPermission: mocktransactionCacheGet
      }
    }
  })
})

describe('my tests', () => {
  it('returns expected summary table result', async () => {
    mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
    const request = getMockRequest()
    const result = await getData(request)
    expect(result).toEqual(
      expect.objectContaining({
        summaryTable: {}
      })
    )
  })
})

describe('contact-summary > route', () => {
  const catalog = Symbol('mock catalog')
  const mockStatusCacheGet = jest.fn(() => ({}))
  const mockStatusCacheSet = jest.fn(() => ({}))
  const mockTransactionCacheGet = jest.fn(() => ({}))
  const mockTransactionCacheSet = jest.fn(() => ({}))
  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet,
          setCurrentPermission: mockStatusCacheSet
        },
        transaction: {
          getCurrentPermission: mockTransactionCacheGet,
          setCurrentPermission: mockTransactionCacheSet
        }
      }
    }),
    i18n: {
      getCatalog: () => catalog
    }
  }

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
        const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
        const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
        const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
        const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
        const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
        const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
        const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
        const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
      const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
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
      const summaryTable = getLicenseeDetailsSummaryRows(mockRequest, permission, 'GB')
      expect(summaryTable).toMatchSnapshot()
    })
  })

  describe('checkNavigation', () => {
    it('should throw a GetDataRedirect if renewal is false on the status and ADDRESS_ENTRY.page and ADDRESS_SELECT are both false', () => {
      const status = {
        renewal: false,
        [ADDRESS_ENTRY.page]: false,
        [ADDRESS_SELECT.page]: false
      }
      const permission = { licenceLength: '12M' }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if CONTACT.page is false on the status', () => {
      const status = {
        renewal: false,
        [CONTACT.page]: false,
        [ADDRESS_ENTRY.page.page]: true,
        [ADDRESS_SELECT.page]: true
      }
      const permission = { licenceLength: '12M' }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })

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
        [LICENCE_CONFIRMATION_METHOD.page]: false,
        [LICENCE_FULFILMENT.page]: true
      }
      const permission = { licenceLength: '12M' }
      expect(() => checkNavigation(status, permission)).toThrow(GetDataRedirect)
    })
  })
})

describe('getLicenseeDetailsSummaryRows', () => {
  const mockTransactionCacheGet = jest.fn()
  it('should return licenseeSummaryArray without newsletter array if licence is not for you', () => {
    const licenseeDetailsSummaryRows = getLicenseeDetailsSummaryRows(getSampleRequest(), getSamplePermission(), 'UNITED KONGDUM')
    expect(licenseeDetailsSummaryRows).toEqual(
      expect.arrayContaining([{
        key: { text: 'address' },
        value: { text: '19, STREET, AREA, TOWN, PO5 7CO, UNITED KONGDUM' },
        actions: {
          items: [{
            href: ADDRESS_LOOKUP.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'address',
            attributes: { id: 'change-address' }
          }]
        }
      },
      {
        key: { text: 'contact_summary_licence' },
        value: { text: 'contact_summary_texts_to_0123456789' },
        actions: {
          items: [{
            href: LICENCE_FULFILMENT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'licence confirmation option',
            attributes: { id: 'change-licence-confirmation-option' }
          }]
        }
      },
      {
        key: { text: 'contact_summary_contact' },
        value: { text: 'contact_summary_texts_to_0123456789' },
        actions: {
          items: [{
            href: CONTACT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'contact',
            attributes: { id: 'change-contact' }
          }]
        }
      }])
    )
  })

  it('should return licenseeSummaryArray with newsletter array if licence is for you', () => {
    mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
    const licenseeDetailsSummaryRows = getLicenseeDetailsSummaryRows(getSampleRequest(), getSamplePermission(), 'UNITED KONGDUM')
    expect(licenseeDetailsSummaryRows).toEqual(
      expect.arrayContaining([{
        key: { text: 'address' },
        value: { text: '19, STREET, AREA, TOWN, PO5 7CO, UNITED KONGDUM' },
        actions: {
          items: [{
            href: ADDRESS_LOOKUP.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'address',
            attributes: { id: 'change-address' }
          }]
        }
      },
      {
        key: { text: 'contact_summary_licence' },
        value: { text: 'contact_summary_texts_to_0123456789' },
        actions: {
          items: [{
            href: LICENCE_FULFILMENT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'licence confirmation option',
            attributes: { id: 'change-licence-confirmation-option' }
          }]
        }
      },
      {
        key: { text: 'contact_summary_contact' },
        value: { text: 'contact_summary_texts_to_0123456789' },
        actions: {
          items: [{
            href: CONTACT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'contact',
            attributes: { id: 'change-contact' }
          }]
        }
      },
      {
        key: { text: 'contact_summary_newsletter' },
        value: { text: 'Yes' },
        actions: {
          items: [{
            href: NEWSLETTER.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'newsletter',
            attributes: { id: 'change-newsletter' }
          }]
        }
      }])
    )
  })

  const getSampleRequest = () => ({
    i18n: {
      getCatalog: () => ({
        address: 'address',
        contact_summary_email_to: 'contact_summary_email_to',
        contact_summary_texts_to: 'contact_summary_texts_to',
        contact_summary_default_make_note: 'contact_summary_default_make_note',
        contact_summary_default_make_note_on_conf: 'contact_summary_default_make_note_on_conf',
        contact_summary_by_post: 'contact_summary_by_post',
        contact_summary_licence: 'contact_summary_licence',
        contact_summary_licence_confirmation: 'contact_summary_licence_confirmation',
        contact_summary_licence_details: 'contact_summary_licence_details',
        contact_summary_contact: 'contact_summary_contact',
        licence_summary_change: 'licence_summary_change',
        contact_summary_newsletter: 'contact_summary_newsletter'
      })
    }
  })

  const getSamplePermission = () => ({
    isLicenceForYou: mockTransactionCacheGet,
    licensee: {
      premises: '19',
      street: 'STREET',
      locality: 'AREA',
      town: 'TOWN',
      postcode: 'PO5 7CO',
      countryName: 'UNITED KONGDUM',
      postalFulfilment: false,
      preferredMethodOfConfirmation: 'Text',
      preferredMethodOfReminder: 'Text',
      preferredMethodOfNewsletter: 'Yes',
      mobilePhone: '_0123456789'
    }
  })
})

describe('getContactDetails and getLicenseeDetailsSummaryRows', () => {
  it('if is physical postal fulfilment then has link to summary change link', () => {
    const contactDetails = getContactDetails(getSampleRequest(), getSamplePermissionPostal())
    expect(contactDetails[0]).toEqual(
      expect.objectContaining({
        key: { text: 'contact_summary_licence' },
        value: { text: 'contact_summary_by_post' },
        actions: {
          items: [{
            href: LICENCE_FULFILMENT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'licence fulfilment option',
            attributes: { id: 'change-licence-fulfilment-option' }
          }]
        }
      })
    )
  })

  it('if is physical postal fulfilment then has link to licence confirmation option link', () => {
    const contactDetails = getContactDetails(getSampleRequest(), getSamplePermissionPostal())
    expect(contactDetails[1]).toEqual(
      expect.objectContaining({
        key: { text: 'contact_summary_licence_confirmation' },
        value: { text: 'contact_summary_by_post' },
        actions: {
          items: [{
            href: LICENCE_CONFIRMATION_METHOD.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'licence confirmation option',
            attributes: { id: 'change-licence-confirmation-option' }
          }]
        }
      })
    )
  })

  it('if is physical postal fulfilment then has link to contact change link', () => {
    const contactDetails = getContactDetails(getSampleRequest(), getSamplePermissionPostal())
    expect(contactDetails[2]).toEqual(
      expect.objectContaining({
        key: { text: 'contact_summary_contact' },
        value: { text: 'contact_summary_by_post' },
        actions: {
          items: [{
            href: CONTACT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'contact',
            attributes: { id: 'change-contact' }
          }]
        }
      })
    )
  })

  it('if is physical but not a postal fulfilment then has link to summary change link', () => {
    const contactDetails = getContactDetails(getSampleRequest(), getSamplePermissionNotPostal())
    expect(contactDetails[0]).toEqual(
      expect.objectContaining({
        key: { text: 'contact_summary_licence' },
        value: { text: 'contact_summary_texts_to_0123456789' },
        actions: {
          items: [{
            href: LICENCE_FULFILMENT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'licence confirmation option',
            attributes: { id: 'change-licence-confirmation-option' }
          }]
        }
      })
    )
  })

  it('if is physical but not a postal fulfilment then has link to contact change link', () => {
    const contactDetails = getContactDetails(getSampleRequest(), getSamplePermissionNotPostal())
    expect(contactDetails[1]).toEqual(
      expect.objectContaining({
        key: { text: 'contact_summary_contact' },
        value: { text: 'contact_summary_texts_to_0123456789' },
        actions: {
          items: [{
            href: CONTACT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'contact',
            attributes: { id: 'change-contact' }
          }]
        }
      })
    )
  })

  it('if is not physical then has link to contact change link', () => {
    isPhysical.mockReturnValueOnce(false)
    const contactDetails = getContactDetails(getSampleRequest(), getSamplePermissionNotPostal())
    expect(contactDetails[0]).toEqual(
      expect.objectContaining({
        key: { text: 'contact_summary_licence_details' },
        value: { text: 'contact_summary_texts_to_0123456789' },
        actions: {
          items: [{
            href: CONTACT.uri,
            text: 'licence_summary_change',
            visuallyHiddenText: 'contact',
            attributes: { id: 'change-contact' }
          }]
        }
      })
    )
  })

  const getSampleRequest = () => ({
    i18n: {
      getCatalog: () => ({
        contact_summary_email_to: 'contact_summary_email_to',
        contact_summary_texts_to: 'contact_summary_texts_to',
        contact_summary_default_make_note: 'contact_summary_default_make_note',
        contact_summary_default_make_note_on_conf: 'contact_summary_default_make_note_on_conf',
        contact_summary_by_post: 'contact_summary_by_post',
        contact_summary_licence: 'contact_summary_licence',
        contact_summary_licence_confirmation: 'contact_summary_licence_confirmation',
        contact_summary_licence_details: 'contact_summary_licence_details',
        contact_summary_contact: 'contact_summary_contact',
        licence_summary_change: 'licence_summary_change'
      })
    }
  })

  const getSamplePermissionPostal = () => ({
    licensee: {
      postalFulfilment: true,
      preferredMethodOfConfirmation: 'smoke-signal',
      preferredMethodOfReminder: 'punch-to-the-face'
    }
  })

  const getSamplePermissionNotPostal = () => ({
    licensee: {
      postalFulfilment: false,
      preferredMethodOfConfirmation: 'Text',
      preferredMethodOfReminder: 'Text',
      mobilePhone: '_0123456789'
    }
  })
})
