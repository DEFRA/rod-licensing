import {
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_START_TIME,
  DATE_OF_BIRTH,
  NO_LICENCE_REQUIRED,
  LICENCE_TYPE,
  NAME,
  DISABILITY_CONCESSION,
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
import { licenceTypeResults } from '../pages/licence-details/licence-type/result-function.js'
import { licenceToStartResults } from '../pages/licence-details/licence-to-start/result-function.js'
import { addressLookupResults } from '../pages/contact/address/lookup/result-function.js'
import { ageConcessionResults } from '../pages/concessions/date-of-birth/result-function.js'
import { licenceLengthResults } from '../pages/licence-details/licence-length/result-function.js'

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
        page: DATE_OF_BIRTH.uri
      }
    }
  },

  {
    currentPage: DATE_OF_BIRTH.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_TO_START.uri
      },
      [ageConcessionResults.NO_LICENCE_REQUIRED]: {
        page: NO_LICENCE_REQUIRED.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : null)
  },

  {
    currentPage: LICENCE_TO_START.page,
    nextPage: {
      [CommonResults.OK]: {
        page: DISABILITY_CONCESSION.uri
      },
      [ageConcessionResults.NO_LICENCE_REQUIRED]: {
        page: NO_LICENCE_REQUIRED.uri
      },
      [licenceToStartResults.AND_START_TIME]: {
        page: LICENCE_START_TIME.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : DATE_OF_BIRTH.uri)
  },

  {
    currentPage: DISABILITY_CONCESSION.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_TYPE.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : LICENCE_TO_START.uri)
  },

  {
    currentPage: LICENCE_TYPE.page,
    nextPage: {
      [licenceTypeResults.ASK_LICENCE_LENGTH]: {
        page: LICENCE_LENGTH.uri
      },
      [licenceTypeResults.SKIP_LICENCE_LENGTH]: {
        page: LICENCE_SUMMARY.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : DISABILITY_CONCESSION.uri)
  },

  {
    currentPage: LICENCE_LENGTH.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY.uri
      },
      [licenceLengthResults.REQUIRE_TIME]: {
        page: LICENCE_START_TIME.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_SUMMARY.uri : LICENCE_TYPE.uri)
  },

  {
    currentPage: LICENCE_START_TIME.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY.uri
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY.uri
      }
    },
    backLink: s => (s.fromSummary ? LICENCE_TO_START.uri : LICENCE_LENGTH.uri)
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

  {
    currentPage: RENEWAL_INACTIVE.page,
    nextPage: {
      [CommonResults.OK]: {
        page: LICENCE_LENGTH.uri
      }
    },
    backLink: IDENTIFY.uri
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
