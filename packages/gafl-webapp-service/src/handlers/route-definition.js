'use strict'

const LICENCE_LENGTH = '/buy/licence-length'
const LICENCE_TYPE = '/buy/licence-type'
const NUMBER_OF_RODS = '/buy/number-of-rods'
const LICENCE_TO_START = '/buy/start-kind'
const LICENCE_START_DATE = '/buy/start-date'
const LICENCE_START_TIME = '/buy/start-time'
const DATE_OF_BIRTH = '/buy/date-of-birth'
const NO_LICENCE_REQUIRED = '/buy/no-licence-required'

export default [
  {
    currentPage: 'start',
    nextPage: {
      ok: {
        page: LICENCE_LENGTH
      }
    }
  },

  {
    currentPage: 'licence-length',
    nextPage: {
      ok: {
        page: LICENCE_TYPE
      }
    }
  },

  {
    currentPage: 'licence-type',
    nextPage: {
      troutAndCoarse: {
        page: NUMBER_OF_RODS
      },
      salmonAndSeaTrout: {
        page: LICENCE_TO_START
      }
    }
  },

  {
    currentPage: 'number-of-rods',
    nextPage: {
      ok: {
        page: LICENCE_TO_START
      }
    }
  },

  {
    currentPage: 'licence-to-start',
    nextPage: {
      afterPayment: {
        page: NO_LICENCE_REQUIRED
      },
      anotherDateOrTime: {
        page: LICENCE_START_DATE
      }
    }
  },

  {
    currentPage: 'licence-start-date',
    nextPage: {
      andStartTime: {
        page: LICENCE_START_TIME
      },
      andContinue: {
        page: DATE_OF_BIRTH
      }
    }
  },

  {
    currentPage: 'licence-start-time',
    nextPage: {
      ok: {
        page: DATE_OF_BIRTH
      }
    }
  },

  {
    currentPage: 'date-of-birth',
    nextPage: {
      adult: {
        page: NO_LICENCE_REQUIRED
      },
      junior: {
        page: NO_LICENCE_REQUIRED
      },
      senior: {
        page: NO_LICENCE_REQUIRED
      }
    }
  }
]
