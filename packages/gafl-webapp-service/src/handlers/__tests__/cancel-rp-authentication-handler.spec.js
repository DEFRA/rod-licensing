import cancelRpAuthenticationHandler from '../cancel-rp-authentication-handler'
import { CONTROLLER } from '../../uri.js'

jest.mock('../../uri.js', () => ({
  CONTROLLER: { uri: Symbol('controller-uri') }
}))

const getSampleResponseToolkit = () => ({
  redirectWithLanguageCode: jest.fn()
})

describe('Cancel RP Authentication Handler', () => {
  it('redirects with language code to CONTROLLER.uri', () => {
    const sampleResponseToolkit = getSampleResponseToolkit()
    cancelRpAuthenticationHandler(undefined, sampleResponseToolkit)
    expect(sampleResponseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(CONTROLLER.uri)
  })
})
