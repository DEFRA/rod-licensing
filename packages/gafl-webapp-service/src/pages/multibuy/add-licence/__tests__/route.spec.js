import { getData } from '../route.js'
import { CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../../../uri.js'
import { createMockRequest } from '../../../../__mocks__/request.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
jest.mock('../../../../handlers/get-data-redirect.js')

describe('add-licence > route', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getData', () => {
    it('redirects to the licence summary page if the user has not visited it yet', async () => {
      const mockRequest = createMockRequest()
      await expect(() => getData(mockRequest)).rejects.toBeInstanceOf(GetDataRedirect)
      expect(GetDataRedirect).toBeCalledWith(LICENCE_SUMMARY.uri)
    })

    it('redirects to the contact summary page if the user has not visited it yet', async () => {
      const mockRequest = createMockRequest({ cache: { status: { [LICENCE_SUMMARY.page]: true } } })
      await expect(() => getData(mockRequest)).rejects.toBeInstanceOf(GetDataRedirect)
      expect(GetDataRedirect).toBeCalledWith(CONTACT_SUMMARY.uri)
    })

    it('does not redirect if user has visited both summary pages', async () => {
      const mockRequest = createMockRequest({
        cache: {
          status: { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true }
        }
      })
      await getData(mockRequest)
      expect(GetDataRedirect).not.toBeCalled()
    })

    it.each([[{ id: 'one' }], [{ id: 'one' }, { id: 'two' }], [{ id: 'one' }, { id: 'two' }, { id: 'three' }, { id: 'four' }]])(
      'returns the correct number of licences',
      async permissions => {
        const mockRequest = createMockRequest({
          cache: {
            status: { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true },
            transaction: { permissions }
          }
        })
        const result = await getData(mockRequest)
        expect(result.numberOfLicences).toBe(permissions.length)
      }
    )
  })
})
