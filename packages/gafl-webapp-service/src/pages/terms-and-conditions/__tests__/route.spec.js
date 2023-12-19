import { getData } from '../route'
import { CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../../uri.js'
import { LICENCE_TYPE } from '../../../processors/mapping-constants.js'

jest.mock('../../../routes/next-page.js', () => ({ nextPage: () => {} }))
jest.mock('../../../routes/page-route.js', () => () => {})
jest.mock('../../../uri.js', () => ({
  TERMS_AND_CONDITIONS: { page: 'terms-and-conditions', uri: '/terms-and-conditions' },
  CONTACT_SUMMARY: { page: 'contact-summary', uri: '/contact-summary' },
  LICENCE_SUMMARY: { page: 'licence-summary', uri: '/licence-summary' }
}))
jest.mock('../../../processors/mapping-constants.js', () => ({
  LICENCE_TYPE: {
    'salmon-and-sea-trout': 'salmon_and_sea_trout'
  }
}))

describe('terms-and-conditions get data', () => {
  const getMockRequest = ({
    licenceSummary = true,
    contactSummary = true,
    licenceType = 'old-wellies-and-shopping-trollies',
    cost = 1.5
  } = {}) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: async () => ({
            [LICENCE_SUMMARY.page]: licenceSummary,
            [CONTACT_SUMMARY.page]: contactSummary
          })
        },
        transaction: {
          getCurrentPermission: async () => ({
            licenceType,
            permit: {
              cost
            }
          })
        }
      }
    })
  })
  it('salmon and sea trout flag is true when licence is a salmon and sea trout one', async () => {
    const request = getMockRequest({ licenceType: LICENCE_TYPE['salmon-and-sea-trout'] })
    const { isSalmonAndSeaTrout } = await getData(request)
    expect(isSalmonAndSeaTrout).toBeTruthy()
  })

  it("salmon and sea trout flag is false when licence is't a salmon and sea trout one", async () => {
    const { isSalmonAndSeaTrout } = await getData(getMockRequest())
    expect(isSalmonAndSeaTrout).toBeFalsy()
  })

  it('payment required flag is true when licence has a cost', async () => {
    const { paymentRequired } = await getData(getMockRequest())
    expect(paymentRequired).toBeTruthy()
  })

  it('payment required flag is false when licence is free', async () => {
    const { paymentRequired } = await getData(getMockRequest({ cost: 0 }))
    expect(paymentRequired).toBeFalsy()
  })

  it("throws a GetDataRedirect to licence summary when status licence summary isn't present", () => {
    const request = getMockRequest({ licenceSummary: false })
    expect(() => getData(request)).rejects.toThrowRedirectTo(LICENCE_SUMMARY.uri)
  })

  it("throws a GetDataRedirect to contact summary when contact summary isn't present", () => {
    const request = getMockRequest({ contactSummary: false })
    expect(() => getData(request)).rejects.toThrowRedirectTo(CONTACT_SUMMARY.uri)
  })
})
