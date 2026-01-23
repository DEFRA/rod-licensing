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
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  CONTACT,
  NEWSLETTER,
  CHOOSE_PAYMENT,
  TERMS_AND_CONDITIONS,
  JOURNEY_GOAL
} from '../../uri.js'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../constants.js'
import { isPhysical } from '../../processors/licence-type-display.js'
jest.mock('../../processors/licence-type-display.js')

describe('The journey-goal page', () => {
  it('has no back-link', () => {
    jest.isolateModules(() => {
      process.env.CHANNEL = 'telesales'
      const isolatedJourneyDefinition = require('../journey-definition.js').default
      const isolatedJourneyGoal = isolatedJourneyDefinition.find(n => n.current.page === JOURNEY_GOAL.page)
      expect(isolatedJourneyGoal.backLink({})).not.toBeTruthy()
      delete process.env.CHANNEL
    })
  })
})

describe('The licence-for page', () => {
  const n = journeyDefinition.find(n => n.current.page === LICENCE_FOR.page)

  it('has no back-link on initial viewing in websales journey', () => {
    expect(n.backLink({})).not.toBeTruthy()
  })

  it('has a back-link to the license summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })

  it('has a back-link to the journey-goal page in telesales journey when cancellation enabled', () => {
    jest.isolateModules(() => {
      process.env.CHANNEL = 'telesales'
      process.env.SHOW_CANCELLATION_JOURNEY = 'true'
      const isolatedJourneyDefinition = require('../journey-definition.js').default
      const isolatedJourneyGoal = isolatedJourneyDefinition.find(n => n.current.page === LICENCE_FOR.page)
      expect(isolatedJourneyGoal.backLink({})).toBe(JOURNEY_GOAL.uri)
      delete process.env.CHANNEL
    })
  })

  it.each([
    ['telesales not flagged', 'CHANNEL', 'not_telesales'],
    ['cancellation journey disabled', 'SHOW_CANCELLATION_JOURNEY', 'false'],
    ['cancellation journey flag undefined', 'SHOW_CANCELLATION_JOURNEY', undefined]
  ])('omits back-link to the journey-goal page if %s', (_d, envKey, envVal) => {
    jest.isolateModules(() => {
      process.env.CHANNEL = 'telesales'
      process.env.SHOW_CANCELLATION_JOURNEY = 'true'
      process.env[envKey] = envVal
      const isolatedJourneyDefinition = require('../journey-definition.js').default
      const isolatedJourneyGoal = isolatedJourneyDefinition.find(n => n.current.page === LICENCE_FOR.page)
      expect(isolatedJourneyGoal.backLink({})).toBeNull()
      delete process.env.CHANNEL
    })
  })

  it('has a back-link to the licence summary in telesales journey if the summary is seen', () => {
    jest.isolateModules(() => {
      process.env.CHANNEL = 'telesales'
      const isolatedJourneyDefinition = require('../journey-definition.js').default
      const isolatedJourneyGoal = isolatedJourneyDefinition.find(n => n.current.page === LICENCE_FOR.page)
      expect(isolatedJourneyGoal.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
      delete process.env.CHANNEL
    })
  })
})

describe('The date-of-birth page', () => {
  const n = journeyDefinition.find(n => n.current.page === DATE_OF_BIRTH.page)

  it('has a back-link to the name page on initial viewing', () => {
    expect(n.backLink({})).toBe(NAME.uri)
  })

  it('has a back-link to the licence summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The licence-to-start page', () => {
  const n = journeyDefinition.find(n => n.current.page === LICENCE_TO_START.page)

  it('has a back-link to the disability concessions page on initial viewing', () => {
    expect(n.backLink({})).toBe(DISABILITY_CONCESSION.uri)
  })

  it('has a back-link to the license summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The disability-concession page', () => {
  const n = journeyDefinition.find(n => n.current.page === DISABILITY_CONCESSION.page)

  it('has a back-link to the date-of-birth page on initial viewing', () => {
    expect(n.backLink({})).toBe(DATE_OF_BIRTH.uri)
  })

  it('has a back-link to the license summary if the summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The licence-type page', () => {
  const n = journeyDefinition.find(n => n.current.page === LICENCE_TYPE.page)

  it('has a back-link to the disability-concession page on initial viewing', () => {
    expect(n.backLink({})).toBe(LICENCE_TO_START.uri)
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

  it('has a back-link to the licence-summary page if the licence-summary is seen', () => {
    expect(n.backLink({ fromSummary: LICENCE_SUMMARY_SEEN })).toBe(LICENCE_SUMMARY.uri)
  })

  it('has a back-link to the licence-for page if the contact summary has not been seen', () => {
    expect(n.backLink({})).toBe(LICENCE_FOR.uri)
  })
})

describe('The address-lookup page', () => {
  const n = journeyDefinition.find(n => n.current.page === ADDRESS_LOOKUP.page)

  it('has a back-link to the licence-summary page if the contact summary has not been seen', () => {
    expect(n.backLink({})).toBe(LICENCE_SUMMARY.uri)
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

  it('has a back-link to the licence-summary page if in renewal', () => {
    const n = journeyDefinition.find(n => n.current.page === LICENCE_FULFILMENT.page)
    expect(n.backLink({}, { isRenewal: true })).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('The licence-confirmation page', () => {
  it('has a back-link to the licence-fulfilment page if the contact-summary has not been seen', () => {
    const n = journeyDefinition.find(n => n.current.page === LICENCE_CONFIRMATION_METHOD.page)
    expect(n.backLink({})).toBe(LICENCE_FULFILMENT.uri)
  })

  it('has a back-link to the licence-fulfilment page if the contact-summary has been seen and the last sumbitted page is licence-fulfilment', () => {
    const n = journeyDefinition.find(n => n.current.page === LICENCE_CONFIRMATION_METHOD.page)
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN, currentPage: LICENCE_FULFILMENT.page })).toBe(LICENCE_FULFILMENT.uri)
  })

  it('has a back-link to the licence-fulfilment page if the contact-summary has been seen and the last sumbitted page is licence-confirmation-method', () => {
    const n = journeyDefinition.find(n => n.current.page === LICENCE_CONFIRMATION_METHOD.page)
    expect(n.backLink({ fromSummary: CONTACT_SUMMARY_SEEN, currentPage: LICENCE_CONFIRMATION_METHOD.page })).toBe(LICENCE_FULFILMENT.uri)
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
    isPhysical.mockReturnValueOnce(true)
    expect(n.backLink({}, {})).toBe(LICENCE_CONFIRMATION_METHOD.uri)
  })

  it('has a back-link to the licence confirmation method page if the contact summary has been seen and the last submitted page is licence confirmation method', () => {
    expect(n.backLink({ currentPage: LICENCE_CONFIRMATION_METHOD.page, fromSummary: CONTACT_SUMMARY_SEEN })).toBe(
      LICENCE_CONFIRMATION_METHOD.uri
    )
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

describe('The choose payment page', () => {
  const n = journeyDefinition.find(n => n.current.page === CHOOSE_PAYMENT.page)

  it('has a back-link to the terms and conditions page', () => {
    expect(n.backLink).toBe(TERMS_AND_CONDITIONS.uri)
  })
})
