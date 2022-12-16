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
  ADD_LICENCE,
  TERMS_AND_CONDITIONS,
  AGREED,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED,
  ORDER_COMPLETE,
  LICENCE_DETAILS,
  IDENTIFY,
  RENEWAL_INACTIVE,
  RENEWAL_START_DATE,
  ADD_PERMISSION,
  VIEW_LICENCES,
  CHANGE_LICENCE_OPTIONS,
  CHANGE_CONTACT_DETAILS
} from '../uri.js'

import { CommonResults, MultibuyForYou, ShowDigitalLicencePages } from '../constants.js'
import { licenceTypeResults } from '../pages/licence-details/licence-type/result-function.js'
import { licenceToStartResults } from '../pages/licence-details/licence-to-start/result-function.js'
import { addressLookupResults } from '../pages/contact/address/lookup/result-function.js'
import { ageConcessionResults } from '../pages/concessions/date-of-birth/result-function.js'
import { licenceLengthResults } from '../pages/licence-details/licence-length/result-function.js'
import { isPhysical } from '../processors/licence-type-display.js'
import backLinkHandlerLicence from '../handlers/back-link-handler-licence.js'
import backLinkHandlerContact from '../handlers/back-link-handler-contact.js'

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
      [MultibuyForYou.YES]: {
        page: LICENCE_TO_START
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: status => backLinkHandlerLicence(status)
  },

  {
    current: NAME,
    next: {
      [CommonResults.OK]: {
        page: DATE_OF_BIRTH
      },
      [CommonResults.AMEND]: {
        page: CHANGE_LICENCE_OPTIONS
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      }
    },
    backLink: status => backLinkHandlerLicence(status, LICENCE_FOR.uri)
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
      },
      [CommonResults.AMEND]: {
        page: CHANGE_LICENCE_OPTIONS
      }
    },
    backLink: status => backLinkHandlerLicence(status, NAME.uri)
  },

  {
    current: DISABILITY_CONCESSION,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_TO_START
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      },
      [CommonResults.AMEND]: {
        page: CHANGE_LICENCE_OPTIONS
      }
    },
    backLink: status => backLinkHandlerLicence(status, DATE_OF_BIRTH.uri)
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
      },
      [CommonResults.AMEND]: {
        page: CHANGE_LICENCE_OPTIONS
      }
    },
    backLink: status => backLinkHandlerLicence(status, DISABILITY_CONCESSION.uri)
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
      },
      [CommonResults.AMEND]: {
        page: CHANGE_LICENCE_OPTIONS
      }
    },
    backLink: status => backLinkHandlerLicence(status, DISABILITY_CONCESSION.uri)
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
      },
      [CommonResults.AMEND]: {
        page: CHANGE_LICENCE_OPTIONS
      }
    },
    backLink: status => backLinkHandlerLicence(status, LICENCE_TYPE.uri)
  },

  {
    current: LICENCE_START_TIME,
    next: {
      [CommonResults.OK]: {
        page: LICENCE_SUMMARY
      },
      [CommonResults.SUMMARY]: {
        page: LICENCE_SUMMARY
      },
      [CommonResults.AMEND]: {
        page: CHANGE_LICENCE_OPTIONS
      }
    },
    backLink: status => (status.fromSummary ? LICENCE_TO_START.uri : LICENCE_LENGTH.uri)
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
      },
      [MultibuyForYou.YES]: {
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
    backLink: status => backLinkHandlerContact(status, LICENCE_SUMMARY.uri)
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
      },
      [CommonResults.AMEND]: {
        page: CHANGE_CONTACT_DETAILS
      }
    },
    backLink: ADDRESS_LOOKUP.uri
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
      },
      [CommonResults.AMEND]: {
        page: CHANGE_CONTACT_DETAILS
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
      },
      [MultibuyForYou.YES]: {
        page: CONTACT_SUMMARY
      },
      [CommonResults.AMEND]: {
        page: CHANGE_CONTACT_DETAILS
      }
    },
    backLink: status => backLinkHandlerContact(status, ADDRESS_LOOKUP.uri)
  },
  {
    current: LICENCE_CONFIRMATION_METHOD,
    next: {
      [CommonResults.OK]: {
        page: CHECK_CONFIRMATION_CONTACT
      },
      [CommonResults.SUMMARY]: {
        page: CONTACT
      },
      [CommonResults.AMEND]: {
        page: CHANGE_CONTACT_DETAILS
      }
    },
    backLink: status => backLinkHandlerContact(status, LICENCE_FULFILMENT.uri)
  },
  {
    current: CHECK_CONFIRMATION_CONTACT,
    next: {
      [CommonResults.OK]: {
        page: CONTACT
      },
      [CommonResults.AMEND]: {
        page: CHANGE_CONTACT_DETAILS
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
      },
      [CommonResults.AMEND]: {
        page: CHANGE_CONTACT_DETAILS
      }
    },
    backLink: (status, transaction) => {
      if (isPhysical(transaction)) {
        return backLinkHandlerContact(status, LICENCE_CONFIRMATION_METHOD.uri)
      }
      return backLinkHandlerContact(status, ADDRESS_LOOKUP.uri)
    }
  },

  {
    current: NEWSLETTER,
    next: {
      [CommonResults.OK]: {
        page: CONTACT_SUMMARY
      },
      [CommonResults.AMEND]: {
        page: CHANGE_CONTACT_DETAILS
      }
    },
    backLink: status => backLinkHandlerContact(status, CONTACT.uri)
  },

  {
    current: CONTACT_SUMMARY,
    next: {
      [CommonResults.OK]: {
        page: ADD_LICENCE
      }
    }
  },

  {
    current: ADD_LICENCE,
    next: {
      [CommonResults.YES]: {
        page: ADD_PERMISSION
      },
      [CommonResults.NO]: {
        page: VIEW_LICENCES
      }
    }
  },

  {
    current: VIEW_LICENCES,
    next: {
      [CommonResults.OK]: {
        page: TERMS_AND_CONDITIONS
      }
    }
  },

  {
    current: CHANGE_LICENCE_OPTIONS,
    next: {
      [CommonResults.OK]: {
        page: VIEW_LICENCES
      }
    }
  },

  {
    current: CHANGE_CONTACT_DETAILS,
    next: {
      [CommonResults.OK]: {
        page: CHANGE_LICENCE_OPTIONS
      }
    }
  },

  {
    current: TERMS_AND_CONDITIONS,
    next: {
      [CommonResults.OK]: {
        page: AGREED
      }
    },
    backLink: VIEW_LICENCES.uri
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
