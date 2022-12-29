import renewalStartDateValidationHandler from '../renewal-start-date-validation-handler'
import { LICENCE_SUMMARY, RENEWAL_START_DATE } from '../../uri.js'

describe('Renewal start date validation handler', () => {
  const getMockRequest = (startYear, startMonth, startDay, renewedEndDate) => ({
    cache: () => ({
      initialize: () => ({}),
      helpers: {
        page: {
          getCurrentPermission: async () => ({
            payload: {
              'licence-start-date-year': startYear || 1970,
              'licence-start-date-month': startMonth || 1,
              'licence-start-date-day': startDay || 1
            }
          }),
          setCurrentPermission: async () => {}
        },
        transaction: {
          getCurrentPermission: async () => ({
            licensee: {
              noLicenceRequired: {}
            },
            renewedEndDate: renewedEndDate || '2023-01-01T00:00:00.000Z'
          }),
          setCurrentPermission: async () => {}
        },
        status: {
          getCurrentPermission: async () => {},
          setCurrentPermission: async () => {}
        }
      }
    })
  })

  const getRequestToolkit = () => ({
    redirectWithLanguageCode: jest.fn()
  })

  it('redirects to the licence summary page when validation passes', async () => {
    const request = getMockRequest(2023, 1, 3, '2023-01-01T00:00:00.000Z')
    const toolkit = getRequestToolkit()

    await renewalStartDateValidationHandler(request, toolkit)

    expect(toolkit.redirectWithLanguageCode).toHaveBeenCalledWith(request, LICENCE_SUMMARY.uri)
  })

  it('redirects to the start page when validation fails', async () => {
    const request = getMockRequest()
    const toolkit = getRequestToolkit()

    await renewalStartDateValidationHandler(request, toolkit)

    expect(toolkit.redirectWithLanguageCode).toHaveBeenCalledWith(request, RENEWAL_START_DATE.uri)
  })
})
