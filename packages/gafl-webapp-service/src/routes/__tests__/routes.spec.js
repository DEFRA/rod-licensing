import {
  licenceLength,
  licenceType,
  licenceFor,
  licenceToStart,
  licenceStartTime,
  contactSummary,
  licenceSummary,
  dateOfBirth,
  noLicenceRequired,
  disabilityConcession,
  name,
  addressLookup,
  addressSelect,
  addressEntry,
  licenceFulfilment,
  licenceConfirmationMethod,
  checkConfirmationContact,
  contact,
  newsletter,
  orderComplete,
  licenceDetails,
  paymentCancelled,
  paymentFailed,
  invalidLink,
  renewalStartDate,
  miscRoutes,
  errorRoutes
} from '../../routes.js'
const routes = require('../routes.js')

describe('routes', () => {
  it('if channel evironment variables are for telesales then telesales route is added to the routes array', async () => {
    // process.ENV.CHANNEL = 'telesales'
    expect(routes.telesalesRoutes).not.toEqual(undefined)
    expect(routes).expect.arrayContaining([
      licenceLength,
      licenceType,
      licenceFor,
      licenceToStart,
      licenceStartTime,
      contactSummary,
      licenceSummary,
      dateOfBirth,
      noLicenceRequired,
      disabilityConcession,
      name,
      addressLookup,
      addressSelect,
      addressEntry,
      licenceFulfilment,
      licenceConfirmationMethod,
      checkConfirmationContact,
      contact,
      newsletter,
      orderComplete,
      licenceDetails,
      paymentCancelled,
      paymentFailed,
      invalidLink,
      renewalStartDate,
      miscRoutes,
      errorRoutes
    ])
  })

  it('if ERROR_PAGE evironment variable is true page error route is added to the routes array', async () => {

  })
})
