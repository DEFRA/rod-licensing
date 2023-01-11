import renewalStartDateValidationHandler from '../renewal-start-date-validation-handler'
import { LICENCE_SUMMARY, RENEWAL_START_DATE } from '../../uri.js'

describe('Renewal start date validation handler', () => {
  const getMockRequest = (startYear = 1970, startMonth = 1, startDay = 1, renewedEndDate = '2023-01-01T00:00:00.000Z') => ({
    cache: () => ({
      initialize: () => ({}),
      helpers: {
        page: {
          getCurrentPermission: async () => ({
            payload: {
              'licence-start-date-year': startYear,
              'licence-start-date-month': startMonth,
              'licence-start-date-day': startDay
            }
          }),
          setCurrentPermission: async () => {}
        },
        transaction: {
          getCurrentPermission: async () => ({
            licensee: {
              noLicenceRequired: {}
            },
            renewedEndDate: renewedEndDate
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

    expect(toolkit.redirectWithLanguageCode).toHaveBeenCalledWith(LICENCE_SUMMARY.uri)
  })

  it('redirects to the start page when validation fails', async () => {
    const request = getMockRequest()
    const toolkit = getRequestToolkit()

    await renewalStartDateValidationHandler(request, toolkit)

    expect(toolkit.redirectWithLanguageCode).toHaveBeenCalledWith(RENEWAL_START_DATE.uri)
  })
})
