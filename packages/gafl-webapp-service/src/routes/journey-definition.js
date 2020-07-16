import {
  LICENCE_LENGTH,
  NUMBER_OF_RODS,
  LICENCE_TO_START,
  LICENCE_START_DATE,
  LICENCE_START_TIME,
  DATE_OF_BIRTH,
  NO_LICENCE_REQUIRED,
  JUNIOR_LICENCE,
  LICENCE_TYPE,
  NAME,
  BENEFIT_CHECK,
  BENEFIT_NI_NUMBER,
  BLUE_BADGE_CHECK,
  BLUE_BADGE_NUMBER,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  ADDRESS_ENTRY,
  CONTACT,
  NEWSLETTER,
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  TERMS_AND_CONDITIONS,
  AGREED,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED,
  IDENTIFY,
  RENEWAL_INACTIVE
} from '../uri.js'

import { CommonResults, CONTACT_SUMMARY_SEEN, LICENCE_SUMMARY_SEEN } from '../constants.js'
import { dateOfBirthResults } from '../pages/concessions/date-of-birth/result-function.js'
import { licenceTypeResults } from '../pages/licence-details/licence-type/result-function.js'
import { licenceToStartResults } from '../pages/licence-details/licence-to-start/result-function.js'
import { licenceStartDate } from '../pages/licence-details/licence-start-date/result-function.js'
import { addressLookupResults } from '../pages/contact/address/lookup/result-function.js'

import * as constants from '../processors/mapping-constants.js'

/**
 * The structure of each atom is as follows
 * currentPage - the current page
 * nextPage - the page the use proceeds to as a consequence of the results of result-function for the page
 * backLink - the location the back link, a uri literal, a function of the current status of a function of the status and transaction
 */
export default [
  {
    currentPage: 'start',
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_LENGTH.uri
      }
    }
  },

  {
    currentPage: RENEWAL_INACTIVE.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_LENGTH.uri
      }
    },
    backLink: IDENTIFY.uri
  },

  {
    currentPage: LICENCE_LENGTH.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_TYPE.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : null)
  },

  {
    currentPage: LICENCE_TYPE.page,
    nextPage: {
      [licenceTypeResults.TROUT_AND_COARSE]: {
        page: NUMBER_OF_RODS.uri
      },
      [licenceTypeResults.TROUT_AND_COARSE_2_ROD]: {
        page: LICENCE_TO_START.uri
      },
      [licenceTypeResults.SALMON_AND_SEA_TROUT]: {
        page: LICENCE_TO_START.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : LICENCE_LENGTH.uri)
  },

  {
    currentPage: NUMBER_OF_RODS.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_TO_START.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : LICENCE_TYPE.uri)
  },

  {
    currentPage: LICENCE_TO_START.page,
    nextPage: {
      [licenceToStartResults.AFTER_PAYMENT]: {
        page: DATE_OF_BIRTH.uri
      },
      [licenceToStartResults.ANOTHER_DATE_OR_TIME]: {
        page: LICENCE_START_DATE.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: (s, t) => {
      if (s.fromSummary) {
        return LICENCE_SUMMARY.uri
      } else if (t.licenceType === constants.LICENCE_TYPE['salmon-and-sea-trout']) {
        return LICENCE_TYPE.uri
      } else {
        return NUMBER_OF_RODS.uri
      }
    }
  },

  {
    currentPage: LICENCE_START_DATE.page,
    nextPage: {
      [licenceStartDate.AND_START_TIME]: {
        page: LICENCE_START_TIME.uri
      },
      [licenceStartDate.AND_CONTINUE]: {
        page: DATE_OF_BIRTH.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: LICENCE_TO_START.uri
  },

  {
    currentPage: LICENCE_START_TIME.page,
    nextPage: {
      [CommonResults.OK]: {
        page: DATE_OF_BIRTH.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: LICENCE_START_DATE.uri
  },

  {
    currentPage: DATE_OF_BIRTH.page,
    nextPage: {
      [dateOfBirthResults.ADULT]: {
        page: BENEFIT_CHECK.uri
      },
      [dateOfBirthResults.SENIOR]: {
        page: BENEFIT_CHECK.uri
      },
      [dateOfBirthResults.JUNIOR]: {
        page: JUNIOR_LICENCE.uri
      },
      [dateOfBirthResults.ADULT_NO_BENEFIT]: {
        page: LICENCE_SUMMARY.uri
      },
      [dateOfBirthResults.SENIOR_NO_BENEFIT]: {
        page: LICENCE_SUMMARY.uri
      },
      [dateOfBirthResults.JUNIOR_NO_BENEFIT]: {
        page: JUNIOR_LICENCE.uri
      },
      [dateOfBirthResults.NO_LICENCE_REQUIRED]: {
        page: NO_LICENCE_REQUIRED.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: (s, t) => {
      if (s.fromSummary) {
        return LICENCE_SUMMARY.uri
      } else if (t.licenceToStart === licenceToStartResults.AFTER_PAYMENT) {
        return LICENCE_TO_START.uri
      } else if (t.licenceLength === '12M') {
        return LICENCE_START_DATE.uri
      } else {
        return LICENCE_START_TIME.uri
      }
    }
  },

  {
    currentPage: JUNIOR_LICENCE.page,
    nextPage: {
      [CommonResults.OK]: {
        page: BENEFIT_CHECK.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: DATE_OF_BIRTH.uri
  },

  {
    currentPage: BENEFIT_CHECK.page,
    nextPage: {
      [CommonResults.NO]: {
        page: BLUE_BADGE_CHECK.uri
      },
      [CommonResults.YES]: {
        page: BENEFIT_NI_NUMBER.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : DATE_OF_BIRTH.uri)
  },

  {
    currentPage: BENEFIT_NI_NUMBER.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: BENEFIT_CHECK.uri
  },

  {
    currentPage: BLUE_BADGE_CHECK.page,
    nextPage: {
      [CommonResults.NO]: {
        page: LICENCE_SUMMARY.uri
      },
      [CommonResults.YES]: {
        page: BLUE_BADGE_NUMBER.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: BENEFIT_CHECK.uri
  },

  {
    currentPage: BLUE_BADGE_NUMBER.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: BLUE_BADGE_CHECK.uri
  },

  {
    currentPage: LICENCE_SUMMARY.page,
    nextPage: {
      [CommonResults.OK]: {
        page: NAME.uri
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY.uri
      }
    }
  },

  {
    currentPage: NAME.page,
    nextPage: {
      [CommonResults.OK]: {
        page: ADDRESS_LOOKUP.uri
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY.uri
      }
    },
    backLink: s => {
      if (s.fromSummary === LICENCE_SUMMARY_SEEN) {
        return LICENCE_SUMMARY.uri
      } else if (s.fromSummary === CONTACT_SUMMARY_SEEN) {
        return CONTACT_SUMMARY.uri
      } else {
        return null
      }
    }
  },

  {
    currentPage: ADDRESS_LOOKUP.page,
    nextPage: {
      [addressLookupResults.FOUND_SOME]: {
        page: ADDRESS_SELECT.uri
      },
      [addressLookupResults.FOUND_NONE]: {
        page: ADDRESS_ENTRY.uri
      }
    },
    backLink: s => (s.fromSummary === CONTACT_SUMMARY_SEEN ? CONTACT_SUMMARY.uri : NAME.uri)
  },

  {
    currentPage: ADDRESS_ENTRY.page,
    nextPage: {
      [CommonResults.OK]: {
        page: CONTACT.uri
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary === CONTACT_SUMMARY_SEEN ? CONTACT_SUMMARY.uri : ADDRESS_LOOKUP.uri)
  },

  {
    currentPage: ADDRESS_SELECT.page,
    nextPage: {
      [CommonResults.OK]: {
        page: CONTACT.uri
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY.uri
      }
    },
    backLink: ADDRESS_LOOKUP.uri
  },

  {
    currentPage: CONTACT.page,
    nextPage: {
      [CommonResults.YES]: {
        page: NEWSLETTER.uri
      },
      [CommonResults.NO]: {
        page: CONTACT_SUMMARY.uri
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary === CONTACT_SUMMARY_SEEN ? CONTACT_SUMMARY.uri : ADDRESS_LOOKUP.uri)
  },

  {
    currentPage: NEWSLETTER.page,
    nextPage: {
      [CommonResults.OK]: {
        page: CONTACT_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary === CONTACT_SUMMARY_SEEN ? CONTACT_SUMMARY.uri : CONTACT.uri)
  },

  {
    currentPage: CONTACT_SUMMARY.page,
    nextPage: {
      [CommonResults.OK]: {
        page: TERMS_AND_CONDITIONS.uri
      }
    }
  },

  // This is the end of the journey. The rest is handled by the agreed handler
  // and the transaction is locked
  {
    currentPage: TERMS_AND_CONDITIONS.page,
    nextPage: {
      [CommonResults.OK]: {
        page: AGREED.uri
      }
    },
    backLink: CONTACT_SUMMARY.uri
  },

  {
    currentPage: PAYMENT_CANCELLED.page,
    nextPage: {
      [CommonResults.OK]: {
        page: AGREED.uri
      }
    }
  },

  {
    currentPage: PAYMENT_FAILED.page,
    nextPage: {
      [CommonResults.OK]: {
        page: AGREED.uri
      }
    }
  },

  // This is the authentication journey
  {
    currentPage: IDENTIFY.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY.uri
      }
    }
  }
]
