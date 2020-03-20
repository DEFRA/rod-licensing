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
        page: '/1'
      },
      junior: {
        page: '/buy/no-licence-required'
      },
      senior: {
        page: '/3'
      }
    }
  }
]
