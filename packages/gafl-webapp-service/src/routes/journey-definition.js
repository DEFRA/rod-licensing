import {
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_START_TIME,
  DATE_OF_BIRTH,
  NO_LICENCE_REQUIRED,
  LICENCE_TYPE,
  LICENCE_FOR,
  NAME,
  DISABILITY_CONCESSION,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  ADDRESS_ENTRY,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  CHECK_CONFIRMATION_CONTACT,
  CONTACT,
  NEWSLETTER,
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  TERMS_AND_CONDITIONS,
  AGREED,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED,
  ORDER_COMPLETE,
  LICENCE_DETAILS,
  IDENTIFY,
  RENEWAL_INACTIVE,
  RENEWAL_START_DATE
} from '../uri.js'

import { CommonResults, CONTACT_SUMMARY_SEEN, ShowDigitalLicencePages } from '../constants.js'
import { licenceTypeResults } from '../pages/licence-details/licence-type/result-function.js'
import { licenceToStartResults } from '../pages/licence-details/licence-to-start/result-function.js'
import { addressLookupResults } from '../pages/contact/address/lookup/result-function.js'
import { ageConcessionResults } from '../pages/concessions/date-of-birth/result-function.js'
import { licenceLengthResults } from '../pages/licence-details/licence-length/result-function.js'
import { isPhysicalOld } from '../processors/licence-type-display.js'

/**
 * The structure of each atom is as follows
 * current - the current page
 * next - the page the use proceeds to as a consequence of the results of result-function for the page
 * backLink - the location the back link, a uri literal, a function of the current status of a function of the status and transaction
 */
export default [
  {
    current: { page: 'start' },
    next: {
      [CommonResults.OK]: {
        page: LICENCE_FOR
      }
    }
  },

  {
    current: LICENCE_FOR,
    next: {
      [CommonResults.OK]: {
        page: NAME
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : null)
  },

  {
    current: NAME,
    next: {
      [CommonResults.OK]: {
        page: DATE_OF_BIRTH
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : LICENCE_FOR.uri)
  },

  {
    current: DATE_OF_BIRTH,
    next: {
      [CommonResults.OK]: {
        page: DISABILITY_CONCESSION
      },
      [ageConcessionResults.NO_LICENCE_REQUIRED]: {
        page: NO_LICENCE_REQUIRED
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : NAME.uri)
  },

  {
    current: DISABILITY_CONCESSION,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_TO_START
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : DATE_OF_BIRTH.uri)
  },

  {
    current: LICENCE_TO_START,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_TYPE
      },
      [ageConcessionResults.NO_LICENCE_REQUIRED]: {
        page: NO_LICENCE_REQUIRED
      },
      [licenceToStartResults.AND_START_TIME]: {
        page: LICENCE_START_TIME
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : DISABILITY_CONCESSION.uri)
  },

  {
    current: NO_LICENCE_REQUIRED,
    backLink: DATE_OF_BIRTH.uri
  },

  {
    current: LICENCE_TYPE,
    next: {
      [licenceTypeResults.ASK_LICENCE_LENGTH]: {
        page: LICENCE_LENGTH
      },
      [licenceTypeResults.SKIP_LICENCE_LENGTH]: {
        page: LICENCE_SUMMARY
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : LICENCE_TO_START.uri)
  },

  {
    current: LICENCE_LENGTH,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY
      },
      [licenceLengthResults.REQUIRE_TIME]: {
        page: LICENCE_START_TIME
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : LICENCE_TYPE.uri)
  },

  {
    current: LICENCE_START_TIME,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_TO_START.uri : LICENCE_LENGTH.uri)
  },

  {
    current: LICENCE_SUMMARY,
    next: {
      [CommonResults.OK]: {
        page: ADDRESS_LOOKUP
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY
      },
      [ShowDigitalLicencePages.YES]: {
        page: LICENCE_FULFILMENT
      }
    }
  },

  {
    current: ADDRESS_LOOKUP,
    next: {
      [addressLookupResults.FOUND_SOME]: {
        page: ADDRESS_SELECT
      },
      [addressLookupResults.FOUND_NONE]: {
        page: ADDRESS_ENTRY
      }
    },
    backLink: s => (s.fromSummary === CONTACT_SUMMARY_SEEN ? CONTACT_SUMMARY.uri : LICENCE_SUMMARY.uri)
  },

  {
    current: ADDRESS_ENTRY,
    next: {
      [ShowDigitalLicencePages.YES]: {
        page: LICENCE_FULFILMENT
      },
      [ShowDigitalLicencePages.NO]: {
        page: CONTACT
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY
      }
    },
    backLink: s => (s.fromSummary === CONTACT_SUMMARY_SEEN ? CONTACT_SUMMARY.uri : ADDRESS_LOOKUP.uri)
  },

  {
    current: ADDRESS_SELECT,
    next: {
      [ShowDigitalLicencePages.YES]: {
        page: LICENCE_FULFILMENT
      },
      [ShowDigitalLicencePages.NO]: {
        page: CONTACT
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY
      }
    },
    backLink: ADDRESS_LOOKUP.uri
  },
  {
    current: LICENCE_FULFILMENT,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_CONFIRMATION_METHOD
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_CONFIRMATION_METHOD
      }
    },
    backLink: (status, permission) => {
      if (status.fromSummary === CONTACT_SUMMARY_SEEN) {
        return CONTACT_SUMMARY.uri
      } else if (permission?.isRenewal) {
        return LICENCE_SUMMARY.uri
      } else {
        return ADDRESS_LOOKUP.uri
      }
    }
  },
  {
    current: LICENCE_CONFIRMATION_METHOD,
    next: {
      [CommonResults.OK]: {
        page: CHECK_CONFIRMATION_CONTACT
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT
      }
    },
    backLink: s => {
      const seenContactSummary = s.fromSummary === CONTACT_SUMMARY_SEEN
      if (
        ([LICENCE_FULFILMENT.page, LICENCE_CONFIRMATION_METHOD.page].includes(s.currentPage) && seenContactSummary) ||
        !seenContactSummary
      ) {
        return LICENCE_FULFILMENT.uri
      }
      return CONTACT_SUMMARY.uri
    }
  },
  {
    current: CHECK_CONFIRMATION_CONTACT,
    next: {
      [CommonResults.OK]: {
        page: CONTACT
      }
    },
    backLink: LICENCE_CONFIRMATION_METHOD.uri
  },
  {
    current: CONTACT,
    next: {
      [CommonResults.OK]: {
        page: NEWSLETTER
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY
      }
    },
    backLink: (status, transaction) => {
      const contactSummarySeen = status.fromSummary === CONTACT_SUMMARY_SEEN
      if (status.currentPage === LICENCE_CONFIRMATION_METHOD.page && contactSummarySeen) {
        return LICENCE_CONFIRMATION_METHOD.uri
      } else if (contactSummarySeen) {
        return CONTACT_SUMMARY.uri
      } else if (isPhysicalOld(transaction)) {
        return LICENCE_CONFIRMATION_METHOD.uri
      }
      return ADDRESS_LOOKUP.uri
    }
  },

  {
    current: NEWSLETTER,
    next: {
      [CommonResults.OK]: {
        page: CONTACT_SUMMARY
      }
    },
    backLink: s => (s.fromSummary === CONTACT_SUMMARY_SEEN ? CONTACT_SUMMARY.uri : CONTACT.uri)
  },

  {
    current: CONTACT_SUMMARY,
    next: {
      [CommonResults.OK]: {
        page: TERMS_AND_CONDITIONS
      }
    }
  },

  // This is the end of the journey. The rest is handled by the agreed handler
  // and the transaction is locked
  {
    current: TERMS_AND_CONDITIONS,
    next: {
      [CommonResults.OK]: {
        page: AGREED
      }
    },
    backLink: CONTACT_SUMMARY.uri
  },

  {
    current: PAYMENT_CANCELLED,
    next: {
      [CommonResults.OK]: {
        page: AGREED
      }
    }
  },

  {
    current: PAYMENT_FAILED,
    next: {
      [CommonResults.OK]: {
        page: AGREED
      }
    }
  },

  {
    current: RENEWAL_INACTIVE,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_LENGTH
      }
    },
    backLink: IDENTIFY.uri
  },

  {
    current: ORDER_COMPLETE,
    backLink: ORDER_COMPLETE.uri
  },

  {
    current: LICENCE_DETAILS,
    backLink: ORDER_COMPLETE.uri
  },

  // This is the authentication journey
  {
    current: IDENTIFY,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY
      }
    }
  },

  // The change start time is handled directly - not via the controller, as it has dynamic validation
  {
    current: RENEWAL_START_DATE,
    backLink: LICENCE_SUMMARY.uri
  }
]
