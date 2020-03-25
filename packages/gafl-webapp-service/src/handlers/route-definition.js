'use strict'

export default [
  {
    currentPage: 'start',
    nextPage: {
      ok: {
        page: '/buy/licence-length'
      }
    }
  },

  {
    currentPage: 'licence-length',
    nextPage: {
      ok: {
        page: '/buy/licence-type'
      }
    }
  },

  {
    currentPage: 'licence-type',
    nextPage: {
      troutAndCoarse: {
        page: '/buy/number-of-rods'
      },
      salmonAndSeaTrout: {
        page: '/buy/start-kind'
      }
    }
  },

  {
    currentPage: 'number-of-rods',
    nextPage: {
      ok: {
        page: '/buy/start-kind'
      }
    }
  },

  {
    currentPage: 'licence-to-start',
    nextPage: {
      afterPayment: {
        page: '/buy/no-licence-required'
      },
      anotherDateOrTime: {
        page: '/buy/start-date'
      }
    }
  },

  {
    currentPage: 'licence-start-date',
    nextPage: {
      andStartTime: {
        page: '/buy/start-time'
      },
      andContinue: {
        page: '/buy/date-of-birth'
      }
    }
  },

  {
    currentPage: 'licence-start-time',
    nextPage: {
      ok: {
        page: '/buy/date-of-birth'
      }
    }
  },

  {
    currentPage: 'date-of-birth',
    nextPage: {
      adult: {
        page: '/buy/no-licence-required'
      },
      junior: {
        page: '/buy/no-licence-required'
      },
      senior: {
        page: '/buy/no-licence-required'
      }
    }
  }
]
