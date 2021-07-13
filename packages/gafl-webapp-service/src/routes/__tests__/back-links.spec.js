import journeyDefinition from '../journey-definition.js'
import {
  DATE_OF_BIRTH,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  DISABILITY_CONCESSION,
  LICENCE_TYPE,
  LICENCE_LENGTH,
  LICENCE_START_TIME,
  NAME,
  CONTACT_SUMMARY,
  ADDRESS_LOOKUP,
  ADDRESS_ENTRY,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  CONTACT,
  NEWSLETTER
} from '../../uri.js'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../constants.js'

describe('The date-of-birth page', () => {
  const n = journeyDefinition.find(n => n.current.page === DATE_OF_BIRTH.page)
  it('has no back-link on initial viewing', () => {
    expect(n.backLink({})).not.toBeTruthy()
  })
  it('has a back-link to the license summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The licence-to-start page', () => {
  const n = journeyDefinition.find(n => n.current.page === LICENCE_TO_START.page)
  it('has a back-link to the date-of-birth page on initial viewing', () => {
    expect(n.backLink({})).toBe(DATE_OF_BIRTH.uri)
  })
  it('has a back-link to the license summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The disability-concession page', () => {
  const n = journeyDefinition.find(n => n.current.page === DISABILITY_CONCESSION.page)
  it('has a back-link to the licence-to-start page on initial viewing', () => {
    expect(n.backLink({})).toBe(LICENCE_TO_START.uri)
  })
  it('has a back-link to the license summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The licence-type page', () => {
  const n = journeyDefinition.find(n => n.current.page === LICENCE_TYPE.page)
  it('has a back-link to the disability-concession page on initial viewing', () => {
    expect(n.backLink({})).toBe(DISABILITY_CONCESSION.uri)
  })
  it('has a back-link to the license summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The licence-length page', () => {
  const n = journeyDefinition.find(n => n.current.page === LICENCE_LENGTH.page)
  it('has a back-link to the licence-type page on initial viewing', () => {
    expect(n.backLink({})).toBe(LICENCE_TYPE.uri)
  })
  it('has a back-link to the license summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The licence-start-time page', () => {
  const n = journeyDefinition.find(n => n.current.page === LICENCE_START_TIME.page)
  it('has a back-link to the licence-length page on initial viewing', () => {
    expect(n.backLink({})).toBe(LICENCE_LENGTH.uri)
  })
  it('has a back-link to the licence-to-start page if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_TO_START.uri)
  })
})

describe('The name page', () => {
  const n = journeyDefinition.find(n => n.current.page === NAME.page)
  it('has no back-link if viewed before summary', () => {
    expect(n.backLink({})).not.toBeTruthy()
  })
  it('has a back-link to the licence-summary page if the licence-summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', () => {
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN })).toBe(CONTACT_SUMMARY.uri)
  })
})

describe('The address-lookup page', () => {
  const n = journeyDefinition.find(n => n.current.page === ADDRESS_LOOKUP.page)
  it('has a back-link to the name page if the contact summary has not been seen', () => {
    expect(n.backLink({})).toBe(NAME.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', () => {
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN })).toBe(CONTACT_SUMMARY.uri)
  })
})

describe('The address-entry page', () => {
  const n = journeyDefinition.find(n => n.current.page === ADDRESS_ENTRY.page)
  it('has a back-link to the address-lookup page if the contact summary has not been seen', () => {
    expect(n.backLink({})).toBe(ADDRESS_LOOKUP.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', () => {
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN })).toBe(CONTACT_SUMMARY.uri)
  })
})

describe('The licence-fulfilment page', () => {
  it('has a back-link to the address-lookup page if the contact summary has not been seen', () => {
    const n = journeyDefinition.find(n => n.current.page === LICENCE_FULFILMENT.page)
    expect(n.backLink({})).toBe(ADDRESS_LOOKUP.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', () => {
    const n = journeyDefinition.find(n => n.current.page === LICENCE_FULFILMENT.page)
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN })).toBe(CONTACT_SUMMARY.uri)
  })
})

describe('The licence-confirmation page', () => {
  it('has a back-link to the licence-fulfilment page if the contact summary has not been seen', () => {
    const n = journeyDefinition.find(n => n.current.page === LICENCE_CONFIRMATION_METHOD.page)
    expect(n.backLink({})).toBe(LICENCE_FULFILMENT.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', () => {
    const n = journeyDefinition.find(n => n.current.page === LICENCE_CONFIRMATION_METHOD.page)
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN })).toBe(CONTACT_SUMMARY.uri)
  })
})

describe('The contact page', () => {
  const n = journeyDefinition.find(n => n.current.page === CONTACT.page)
  it('has a back-link to the address-lookup page if the contact summary has not been seen and is not a physical licence', () => {
    expect(n.backLink({}, {})).toBe(ADDRESS_LOOKUP.uri)
  })
  it('has a back-link to the licence confirmation method page if the contact summary has not been seen and is a physical licence', () => {
    expect(n.backLink({}, { licenceLength: '12M' })).toBe(LICENCE_CONFIRMATION_METHOD.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', () => {
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN })).toBe(CONTACT_SUMMARY.uri)
  })
})

describe('The newsletter page', () => {
  const n = journeyDefinition.find(n => n.current.page === NEWSLETTER.page)
  it('has a back-link to the contact page if the contact summary has not been seen', () => {
    expect(n.backLink({})).toBe(CONTACT.uri)
  })
  it('has a back-link to the contact-summary page if the contact-summary is seen', () => {
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN })).toBe(CONTACT_SUMMARY.uri)
  })
})
