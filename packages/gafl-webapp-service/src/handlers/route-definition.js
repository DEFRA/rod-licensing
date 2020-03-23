'use strict'

export default [
  {
    currentPage: 'start',
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
        page: '/buy/licence-length'
      }
    }
  },

  {
    currentPage: 'number-of-rods',
    nextPage: {
      ok: {
        page: '/buy/licence-length'
      }
    }
  },

  {
    currentPage: 'date-of-birth',
    nextPage: {
      adult: {
        page: '/1'
      },
      junior: {
        page: '/2'
      },
      senior: {
        page: '/3'
      }
    }
  }
]
