import { CONTACT } from '../../../../../uri.js'
import { HOW_CONTACTED } from '../../../../../processors/mapping-constants.js'
import { getData } from '../route.js'
import GetDataRedirect from '../../../../../handlers/get-data-redirect.js'

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

  it('if preferred method of confirmation is none, redirects to contact page', async () => {
    const getDataRedirectError = new GetDataRedirect(CONTACT.uri)
    const func = async () => await getData(createRequestMock({ preferredMethodOfConfirmation: HOW_CONTACTED.none }))
    await expect(func).rejects.toThrow(getDataRedirectError)
  })

  it('returns the expected data', async () => {
    expect(await getData(createRequestMock())).toMatchSnapshot()
  })
})
