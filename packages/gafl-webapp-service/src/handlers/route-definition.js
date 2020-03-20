'use strict'

export default [
  {
    currentPage: '/date-of-birth',
    nextPage: {
      adult: {
        page: '/name',
        skipIfComplete: true
      },
      junior: {
        page: '/name',
        skipIfComplete: true
      },
      senior: {
        page: '/name',
        skipIfComplete: true
      }
    }
  }
]
