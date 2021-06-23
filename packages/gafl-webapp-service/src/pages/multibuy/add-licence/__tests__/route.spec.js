import { getData } from '../route.js'
import { CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../../../uri.js'

import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
jest.mock('../../../../handlers/get-data-redirect.js')

import { createMockRequest } from '../../../../__mocks__/request-cache'

describe('The add licence route .getData', () => {
  it('redirects to the licence summary page if the user has not visited it yet', async () => {
    const request = createMockRequest()
    try {
      await getData(request)
    } catch (err) {
      expect(GetDataRedirect).toBeCalledWith(LICENCE_SUMMARY.uri)
    }
  })
  
  it('redirects to the contact summary page if the user has not visited it yet', async () => {
    const request = createMockRequest({ cache: { status: { [LICENCE_SUMMARY.page]: true } }})
    try {
      await getData(request)
    } catch (err) {
      expect(GetDataRedirect).toBeCalledWith(CONTACT_SUMMARY.uri)
    }
  })
  
  it('does not redirect if user has visited both summary pages', async () => {
    const request = createMockRequest({ cache: {
      status: { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true }
    }})
    await getData(request)
    expect(GetDataRedirect).toBeCalledWith(CONTACT_SUMMARY.uri)
  })

  it.each([
    [{id: 'one'}],
    [{id: 'one'}, {id: 'two'}],
    [{id: 'one'}, {id: 'two'}, {id: 'three' }, { id: 'four'}]
  ])('returns the correct number of licences',
  async permissions => {
    const request = createMockRequest({ cache: {
        status: { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true },
        transaction: { permissions }
       }})
    const result = await getData(request)
    expect(result.numberOfLicences).toBe(permissions.length)
  }
  )
})