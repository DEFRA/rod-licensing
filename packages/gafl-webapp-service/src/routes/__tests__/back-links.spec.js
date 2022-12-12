import journeyDefinition from '../journey-definition.js'
import {
  DATE_OF_BIRTH,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  DISABILITY_CONCESSION,
  LICENCE_TYPE,
  LICENCE_FOR,
  LICENCE_LENGTH,
  LICENCE_START_TIME,
  NAME,
  CONTACT_SUMMARY,
  ADDRESS_LOOKUP,
  ADDRESS_ENTRY,
  ADDRESS_SELECT,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  CONTACT,
  NEWSLETTER,
  CHANGE_LICENCE_OPTIONS,
  CHANGE_CONTACT_DETAILS
} from '../../uri.js'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN, CHANGE_LICENCE_OPTIONS_SEEN, CHANGE_CONTACT_DETAILS_SEEN } from '../../constants.js'

describe('The licence-for page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === LICENCE_FOR.page)
  it('has no back-link on initial viewing', async () => {
    const status = {}
    const result = await currentPage.backLink(status)
    expect(result).not.toBeTruthy()
  })
  it('has a back-link to the licence summary if the summary is seen', async () => {
    const status = {
      fromSummary: LICENCE_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to the licence options if the licence options page is seen', async () => {
    const status = {
      fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
  })
})

describe('The name page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === NAME.page)
  it('has a back-link to the licence-summary page if the licence-summary is seen', async () => {
    const status = {
      fromSummary: LICENCE_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to the change-options page if the change-options is seen', async () => {
    const status = {
      fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
  })
  it('has a back-link to the licence-for page if the contact, licence and options summary has not been seen', async () => {
    const status = {}
    const result = await currentPage.backLink(status, LICENCE_FOR.uri)
    expect(result).toBe(LICENCE_FOR.uri)
  })
  it('has a back-link to the licence-for page if the request does not include cache function', async () => {
    const result = await currentPage.backLink({})
    expect(result).toBe(LICENCE_FOR.uri)
  })
})

describe('The date-of-birth page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === DATE_OF_BIRTH.page)
  it('has a back-link to the name page on initial viewing', async () => {
    const status = {}
    const result = await currentPage.backLink(status, NAME.uri)
    expect(result).toBe(NAME.uri)
  })
  it('has a back-link to the licence summary if the summary is seen', async () => {
    const status = {
      fromSummary: LICENCE_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to licence options if the licence-options page is seen', async () => {
    const status = {
      fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
  })
})

describe('The disability-concession page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === DISABILITY_CONCESSION.page)
  it('has a back-link to the date-of-birth page on initial viewing', async () => {
    const status = {}
    const result = await currentPage.backLink(status, DATE_OF_BIRTH.uri)
    expect(result).toBe(DATE_OF_BIRTH.uri)
  })
  it('has a back-link to the licence summary if the summary is seen', async () => {
    const status = {
      fromSummary: LICENCE_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to licence options if the licence-options page is seen', async () => {
    const status = {
      fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
  })
})

describe('The licence-to-start page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === LICENCE_TO_START.page)
  it('has a back-link to the disability concessions page on initial viewing', async () => {
    const status = {}
    const result = await currentPage.backLink(status, DISABILITY_CONCESSION.uri)
    expect(result).toBe(DISABILITY_CONCESSION.uri)
  })
  it('has a back-link to the licence summary if the summary is seen', async () => {
    const status = {
      fromSummary: LICENCE_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to licence options if the licence-options page is seen', async () => {
    const status = {
      fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
  })
})

describe('The licence-type page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === LICENCE_TYPE.page)
  it('has a back-link to the disability-concession page on initial viewing', async () => {
    const status = {}
    const result = await currentPage.backLink(status, DISABILITY_CONCESSION.uri)
    expect(result).toBe(DISABILITY_CONCESSION.uri)
  })
  it('has a back-link to the licence summary if the summary is seen', async () => {
    const status = {
      fromSummary: LICENCE_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to licence options if the licence-options page is seen', async () => {
    const status = {
      fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
  })
})

describe('The licence-length page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === LICENCE_LENGTH.page)
  it('has a back-link to the licence-type page on initial viewing', async () => {
    const status = {}
    const result = await currentPage.backLink(status, LICENCE_TYPE.uri)
    expect(result).toBe(LICENCE_TYPE.uri)
  })
  it('has a back-link to the licence summary if the summary is seen', async () => {
    const status = {
      fromSummary: LICENCE_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to licence options if the licence-options page is seen', async () => {
    const status = {
      fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
  })
})

describe('The licence-start-time page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === LICENCE_START_TIME.page)
  it('has a back-link to the licence-length page on initial viewing', () => {
    expect(currentPage.backLink({})).toBe(LICENCE_LENGTH.uri)
  })
  it('has a back-link to the licence-to-start page if the summary is seen', () => {
    expect(currentPage.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_TO_START.uri)
  })
})

describe('The address-lookup page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === ADDRESS_LOOKUP.page)
  it('has a back-link to the licence-summary page if the contact summary has not been seen', async () => {
    const status = {}
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', async () => {
    const status = {
      fromSummary: CONTACT_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CONTACT_SUMMARY.uri)
  })
  it('has a back-link to contact details if the contact-details page is seen', async () => {
    const status = {
      fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_CONTACT_DETAILS.uri)
  })
})

describe('The address-entry page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === ADDRESS_ENTRY.page)
  it('has a back-link to the address-lookup page', () => {
    expect(currentPage.backLink).toBe(ADDRESS_LOOKUP.uri)
  })
})

describe('The address-select page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === ADDRESS_SELECT.page)
  it('has a back-link to the address-lookup page', () => {
    expect(currentPage.backLink).toBe(ADDRESS_LOOKUP.uri)
  })
})

describe('The licence-fulfilment page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === LICENCE_FULFILMENT.page)
  it('has a back-link to the address-lookup page if the contact summary has not been seen', async () => {
    const status = {}
    const result = await currentPage.backLink(status)
    expect(result).toBe(ADDRESS_LOOKUP.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', async () => {
    const status = {
      fromSummary: CONTACT_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CONTACT_SUMMARY.uri)
  })
  it('has a back-link to the licence-summary page if in renewal', async () => {
    const status = {
      isRenewal: true
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to contact details if the contact-details page is seen', async () => {
    const status = {
      fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_CONTACT_DETAILS.uri)
  })
})

describe('The licence-confirmation page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === LICENCE_CONFIRMATION_METHOD.page)
  it('has a back-link to the licence-fulfilment page if the contact-summary has not been seen', async () => {
    const status = {}
    const result = await currentPage.backLink(status)
    expect(result).toBe(LICENCE_FULFILMENT.uri)
  })
  it('has a back-link to the contact summary page if the contact-summary has been seen', async () => {
    const status = {
      fromSummary: CONTACT_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CONTACT_SUMMARY.uri)
  })
  it('has a back-link to contact details if the contact-details page is seen', async () => {
    const status = {
      fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CHANGE_CONTACT_DETAILS.uri)
  })
})

describe('The contact page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === CONTACT.page)
  it('has a back-link to the address-lookup page if the contact summary has not been seen and is not a physical licence', async () => {
    const status = {}
    const transaction = {
      licenceLength: '1D'
    }
    const result = await currentPage.backLink(status, transaction)
    expect(result).toBe(ADDRESS_LOOKUP.uri)
  })
  it('has a back-link to the licence confirmation method page if the contact summary has not been seen and is a physical licence', async () => {
    const status = {}
    const transaction = {
      licenceLength: '12M'
    }
    const result = await currentPage.backLink(status, transaction)
    expect(result).toBe(LICENCE_CONFIRMATION_METHOD.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', async () => {
    const status = {
      fromSummary: CONTACT_SUMMARY_SEEN
    }
    const transaction = {}
    const result = await currentPage.backLink(status, transaction)
    expect(result).toBe(CONTACT_SUMMARY.uri)
  })
  it('has a back-link to contact details if the contact-details page is seen', async () => {
    const status = {
      fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.SEEN
    }
    const transaction = {}
    const result = await currentPage.backLink(status, transaction)
    expect(result).toBe(CHANGE_CONTACT_DETAILS.uri)
  })
})

describe('The newsletter page', () => {
  const currentPage = journeyDefinition.find(currentPage => currentPage.current.page === NEWSLETTER.page)
  it('has a back-link to the contact page if the contact summary has not been seen', async () => {
    const status = {}
    const result = await currentPage.backLink(status)
    expect(result).toBe(CONTACT.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', async () => {
    const status = {
      fromSummary: CONTACT_SUMMARY_SEEN
    }
    const result = await currentPage.backLink(status)
    expect(result).toBe(CONTACT_SUMMARY.uri)
  })
})
