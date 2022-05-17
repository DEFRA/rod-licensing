import { CONTACT, LICENCE_CONFIRMATION_METHOD } from '../../../../../uri.js'
import { HOW_CONTACTED } from '../../../../../processors/mapping-constants.js'
import { getData } from '../route.js'
import GetDataRedirect from '../../../../../handlers/get-data-redirect.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'

jest.mock('../../../../../processors/uri-helper.js')
jest.mock('../../../../../processors/mapping-constants.js', () => ({
  HOW_CONTACTED: {
    none: 'nada',
    email: 'e-mail',
    text: 'mobile-phone'
  }
}))
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CONTACT: { uri: 'contact.url' },
  LICENCE_CONFIRMATION_METHOD: { uri: 'licence-confirmation-method.url' }
}))

describe('.getData', () => {
  const createRequestMock = (options = {}) => ({
    cache: jest.fn(() => ({
      helpers: {
        transaction: {
          getCurrentPermission: jest.fn(() => ({
            licensee: {
              firstName: 'Lando',
              lastName: 'Norris',
              preferredMethodOfConfirmation: options.preferredMethodOfConfirmation || 'email'
            }
          }))
        }
      }
    }))
  })

  beforeEach(jest.resetAllMocks)

  it('if preferred method of confirmation is none, redirects to contact page', async () => {
    const getDataRedirectError = new GetDataRedirect(CONTACT.uri)
    const func = async () => await getData(createRequestMock({ preferredMethodOfConfirmation: HOW_CONTACTED.none }))
    await expect(func).rejects.toThrow(getDataRedirectError)
  })

  it.each([
    { preferredMethodOfConfirmation: HOW_CONTACTED.email, changeType: 'email' },
    { preferredMethodOfConfirmation: HOW_CONTACTED.text, changeType: 'mobile' }
  ])(
    'appends ?change=$changeType to licenceConfirmationMethod url for changeLinkUrl',
    async ({ preferredMethodOfConfirmation, changeType }) => {
      const changeLinkURL = `${LICENCE_CONFIRMATION_METHOD.uri}?change=${changeType}`
      const data = await getData(createRequestMock({ preferredMethodOfConfirmation }))
      expect(data.uri.change).toEqual(changeLinkURL)
    }
  )

  describe.each([
    { urlName: 'licenceConfirmationMethod', url: LICENCE_CONFIRMATION_METHOD.uri },
    { urlName: 'contact', url: CONTACT.uri }
  ])('$urlName is decorated by addLanguageCodeToUri', ({ urlName, url }) => {
    it(`passes request and ${urlName} url to addLanguageCodeToUri`, async () => {
      const request = createRequestMock()
      await getData(request)
      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, url)
    })

    it(`returns decorated value for ${urlName} from addLanguageCodeToUri`, async () => {
      const expectedUrl = Symbol(urlName)
      addLanguageCodeToUri.mockReturnValue(expectedUrl)
      const request = createRequestMock()
      const data = await getData(request)
      expect(data).toEqual(
        expect.objectContaining({
          uri: expect.objectContaining({
            [urlName]: expectedUrl
          })
        })
      )
    })
  })

  it('returns the expected data', async () => {
    expect(await getData(createRequestMock())).toMatchSnapshot()
  })
})
