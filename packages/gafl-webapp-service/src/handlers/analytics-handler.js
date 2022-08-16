/**
 * Analytics route handler
 * @param request
 * @param h
 * @returns {Promise}
 */

export default async (request, h) => {
  console.log('handler')
  return h.redirect('/buy')
  // const status = request.cache().helpers.status.get()
  // const currentPage = status.currentPage || 'start'

  // setAnalytics(request)

  // const { payload } = await request.cache().helpers.page.getCurrentPermission('analytics')
  // const analyticsMessageDisplay = payload['analytics-response']
  // if (analyticsMessageDisplay === false) {
  //   status.analyticsMessageDisplay = false
  //   await request.cache().helpers.status.set(status)
  // }

  // return h.redirect(currentPage)
}

// export const checkAnalytics = async (request) => {
//   const status = await request.cache().helpers.status.get()

//   if (status.acceptedTracking === true) {
//     return true
//   }

//   return false
// }

// export const setAnalytics = async (request) => {
// const { payload } = await request.cache().helpers.page.getCurrentPermission('analytics')
// const status = request.cache().helpers.status.get()

// status.acceptedTracking = payload['analytics-response']
// status.analyticsSelected = true
// status.analyticsMessageDisplay = payload['analytics-seen']
// await request.cache().helpers.status.set(status)

//   console.log('test')
// }
