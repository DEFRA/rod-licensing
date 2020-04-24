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
  AGREED
} from '../constants.js'

export default [
  {
    currentPage: 'start',
    nextPage: {
      ok: {
        page: LICENCE_LENGTH.uri
      }
    }
  },

  {
    currentPage: LICENCE_LENGTH.page,
    nextPage: {
      ok: {
        page: LICENCE_TYPE.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: LICENCE_TYPE.page,
    nextPage: {
      troutAndCoarse: {
        page: NUMBER_OF_RODS.uri
      },
      troutAndCoarseTwoRod: {
        page: LICENCE_TO_START.uri
      },
      salmonAndSeaTrout: {
        page: LICENCE_TO_START.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: NUMBER_OF_RODS.page,
    nextPage: {
      ok: {
        page: LICENCE_TO_START.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: LICENCE_TO_START.page,
    nextPage: {
      afterPayment: {
        page: DATE_OF_BIRTH.uri
      },
      anotherDateOrTime: {
        page: LICENCE_START_DATE.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: LICENCE_START_DATE.page,
    nextPage: {
      andStartTime: {
        page: LICENCE_START_TIME.uri
      },
      andContinue: {
        page: DATE_OF_BIRTH.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: LICENCE_START_TIME.page,
    nextPage: {
      ok: {
        page: DATE_OF_BIRTH.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: DATE_OF_BIRTH.page,
    nextPage: {
      adult: {
        page: BENEFIT_CHECK.uri
      },
      adultNoBenefitCheck: {
        page: LICENCE_SUMMARY.uri
      },
      junior: {
        page: JUNIOR_LICENCE.uri
      },
      senior: {
        page: LICENCE_SUMMARY.uri
      },
      noLicenceRequired: {
        page: NO_LICENCE_REQUIRED.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: JUNIOR_LICENCE.page,
    nextPage: {
      ok: {
        page: LICENCE_SUMMARY.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: BENEFIT_CHECK.page,
    nextPage: {
      no: {
        page: BLUE_BADGE_CHECK.uri
      },
      yes: {
        page: BENEFIT_NI_NUMBER.uri
      }
    }
  },

  {
    currentPage: BENEFIT_NI_NUMBER.page,
    nextPage: {
      ok: {
        page: LICENCE_SUMMARY.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: BLUE_BADGE_CHECK.page,
    nextPage: {
      no: {
        page: LICENCE_SUMMARY.uri
      },
      yes: {
        page: BLUE_BADGE_NUMBER.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: BENEFIT_NI_NUMBER.page,
    nextPage: {
      ok: {
        page: LICENCE_SUMMARY.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: BLUE_BADGE_NUMBER.page,
    nextPage: {
      ok: {
        page: LICENCE_SUMMARY.uri
      },
      summary: {
        page: LICENCE_SUMMARY.uri
      }
    }
  },

  {
    currentPage: LICENCE_SUMMARY.page,
    nextPage: {
      ok: {
        page: NAME.uri
      },
      summary: {
        page: CONTACT_SUMMARY.uri
      }
    }
  },

  {
    currentPage: NAME.page,
    nextPage: {
      ok: {
        page: ADDRESS_LOOKUP.uri
      },
      summary: {
        page: CONTACT_SUMMARY.uri
      }
    }
  },

  {
    currentPage: ADDRESS_LOOKUP.page,
    nextPage: {
      foundSome: {
        page: ADDRESS_SELECT.uri
      },
      foundNone: {
        page: ADDRESS_ENTRY.uri
      }
    }
  },

  {
    currentPage: ADDRESS_ENTRY.page,
    nextPage: {
      ok: {
        page: CONTACT.uri
      },
      summary: {
        page: CONTACT_SUMMARY.uri
      }
    }
  },

  {
    currentPage: ADDRESS_SELECT.page,
    nextPage: {
      ok: {
        page: CONTACT.uri
      },
      summary: {
        page: CONTACT_SUMMARY.uri
      }
    }
  },

  {
    currentPage: CONTACT.page,
    nextPage: {
      yes: {
        page: NEWSLETTER.uri
      },
      no: {
        page: CONTACT_SUMMARY.uri
      },
      summary: {
        page: CONTACT_SUMMARY.uri
      }
    }
  },

  {
    currentPage: NEWSLETTER.page,
    nextPage: {
      ok: {
        page: CONTACT_SUMMARY.uri
      }
    }
  },

  {
    currentPage: CONTACT_SUMMARY.page,
    nextPage: {
      ok: {
        page: TERMS_AND_CONDITIONS.uri
      }
    }
  },

  // This is the end of the journey. The rest is handled by the agreed handler
  // and the transaction is locked
  {
    currentPage: TERMS_AND_CONDITIONS.page,
    nextPage: {
      ok: {
        page: AGREED.uri
      }
    }
  }
]
