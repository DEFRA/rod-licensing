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

const getMessages = () => ({
  terms_conds_agree_notify_bobo: 'Notify bobo agree',
  terms_conds_body_notify_bobo: 'Notify bobo body',
  terms_conds_bulletpoint_1_notify_bobo: 'Notify bobo bulletpoint 1',
  terms_conds_bulletpoint_2_notify_bobo: 'Notify bobo bulletpoint 2',
  terms_conds_bulletpoint_3_notify_bobo: 'Notify bobo bulletpoint 3',
  terms_conds_bulletpoint_4_1_notify_bobo: 'Notify bobo bulletpoint 4 part 1',
  terms_conds_bulletpoint_4_2_notify_bobo: 'Notify bobo bulletpoint 4 part 2',
  terms_conds_bulletpoint_4_link_notify_bobo: 'Notify bobo bulletpoint 4 link',
  terms_conds_bulletpoint_5_notify_bobo: 'Notify bobo bulletpoint 5',
  terms_conds_bulletpoint_6_notify_bobo: 'Notify bobo bulletpoint 6',
  terms_conds_bulletpoint_6_link_notify_bobo: 'Notify bobo bulletpoint 6 link',
  terms_conds_title_notify_bobo: 'Notify bobo title',
  terms_conds_agree_notify_self: 'Notify self agree',
  terms_conds_body_notify_self: 'Notify self body',
  terms_conds_bulletpoint_1_notify_self: 'Notify self bulletpoint 1',
  terms_conds_bulletpoint_2_notify_self: 'Notify self bulletpoint 2',
  terms_conds_bulletpoint_3_notify_self: 'Notify self bulletpoint 3',
  terms_conds_bulletpoint_4_1_notify_self: 'Notify self bulletpoint 4 part 1',
  terms_conds_bulletpoint_4_2_notify_self: 'Notify self bulletpoint 4 part 2',
  terms_conds_bulletpoint_4_link_notify_self: 'Notify self bulletpoint 4 link',
  terms_conds_bulletpoint_5_notify_self: 'Notify self bulletpoint 5',
  terms_conds_bulletpoint_6_notify_self: 'Notify self bulletpoint 6',
  terms_conds_bulletpoint_6_link_notify_self: 'Notify self bulletpoint 6 link',
  terms_conds_title_notify_self: 'Notify self title'
})

describe('terms-and-conditions get data', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  const getMockRequest = ({
    licenceSummary = true,
    contactSummary = true,
    licenceType = 'old-wellies-and-shopping-trollies',
    cost = 1.5,
    isLicenceForYou = true
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
            isLicenceForYou,
            permit: {
              cost
            }
          })
        }
      }
    }),
    i18n: {
      getCatalog: () => getMessages()
    }
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

  it.each([[true], [false]])('content returns notify content when isLicenceForYou equals %s', async isLicenceForYou => {
    const { content } = await getData(getMockRequest({ isLicenceForYou }))
    expect(content).toMatchSnapshot()
  })
})
