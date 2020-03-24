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
    currentPage: '/buy/licence-length',
    nextPage: {
      ok: {
        page: '/buy/no-licence-required'
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
