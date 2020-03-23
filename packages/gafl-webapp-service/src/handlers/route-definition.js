'use strict'

export default [
  {
    currentPage: 'start',
    nextPage: {
      ok: {
        page: '/buy/name'
      }
    }
  },
  {
    currentPage: 'name',
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
        page: '/buy/name'
      },
      junior: {
        page: '/buy/no-licence-required'
      },
      senior: {
        page: '/buy/name'
      }
    }
  }
]
