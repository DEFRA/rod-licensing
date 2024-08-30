import Boom from '@hapi/boom'
import permissionRenewalData from '../renewals.js'
import { preparePermissionDataForRenewal } from '../../../services/renewals/renewals.service.js'
import { executeQuery, permissionForFullReferenceNumber } from '@defra-fish/dynamics-lib'
import {
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_CONCESSION_PROOF_ENTITY,
  MOCK_CONCESSION
} from '../../../__mocks__/test-data.js'

jest.mock('../../../services/renewals/renewals.service.js', () => ({
  preparePermissionDataForRenewal: jest.fn()
}))

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  concessionsByIds: jest.fn(),
  permissionForFullReferenceNumber: jest.fn(),
  executeQuery: jest.fn()
}))

const getMockRequest = (referenceNumber = 'ABC123') => ({
  params: { referenceNumber }
})

const getMockResponseToolkit = () => ({
  response: jest.fn()
})

const permissionForFullReferenceNumberMock = () => ({
  entity: MOCK_EXISTING_PERMISSION_ENTITY,
  expanded: {
    licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
    concessionProofs: [{ entity: MOCK_CONCESSION_PROOF_ENTITY, expanded: { concession: { entity: MOCK_CONCESSION } } }],
    permit: { entity: MOCK_1DAY_SENIOR_PERMIT_ENTITY, expanded: {} }
  }
})

describe('permissionRenewalData', () => {
  beforeEach(jest.clearAllMocks)

  it('should call permissionForFullReferenceNumber with referenceNumber', async () => {
    executeQuery.mockResolvedValueOnce([permissionForFullReferenceNumberMock()])

    const referenceNumber = 'REFERENCE123'
    const request = getMockRequest(referenceNumber)
    const responseToolkit = getMockResponseToolkit()

    await permissionRenewalData[0].options.handler(request, responseToolkit)

    expect(permissionForFullReferenceNumber).toHaveBeenCalledWith(referenceNumber)
  })

  it('should call preparePermissionDataForRenewal with the expected data', async () => {
    executeQuery.mockResolvedValueOnce([permissionForFullReferenceNumberMock()])

    await permissionRenewalData[0].options.handler(getMockRequest(), getMockResponseToolkit())

    expect(preparePermissionDataForRenewal).toMatchSnapshot()
  })

  it('should set concessions to an empty array if concessions is empty', async () => {
    const permissionMock = permissionForFullReferenceNumberMock()
    permissionMock.expanded.concessionProofs = []
    executeQuery.mockResolvedValueOnce([permissionMock])

    await permissionRenewalData[0].options.handler(getMockRequest(), getMockResponseToolkit())

    expect(preparePermissionDataForRenewal.mock.calls[0][0].concessions).toEqual([])
  })

  it('should return continue response', async () => {
    executeQuery.mockResolvedValueOnce([permissionForFullReferenceNumberMock()])
    const request = getMockRequest({})
    const responseToolkit = getMockResponseToolkit()

    expect(await permissionRenewalData[0].options.handler(request, responseToolkit)).toEqual(responseToolkit.continue)
  })

  describe('metadata', () => {
    it.each(['description', 'notes', 'tags', 'validate'])('should have expected %s', async key => {
      expect(permissionRenewalData[0].options[key]).toMatchSnapshot()
    })
  })

  describe('if there are no matching permissions', () => {
    it('should raise an error', async () => {
      executeQuery.mockResolvedValueOnce([])
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()

      const boomError = Boom.unauthorized('Permission not found for renewal')
      await expect(permissionRenewalData[0].options.handler(request, responseToolkit)).rejects.toThrow(boomError)
    })
  })

  describe('if there are multiple matching permissions', () => {
    it('should raise an error', async () => {
      executeQuery.mockResolvedValueOnce(['foo', 'bar'])
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()

      const error = 'Unable to get permission data for renewal, non-unique results for query'
      await expect(permissionRenewalData[0].options.handler(request, responseToolkit)).rejects.toThrow(error)
    })
  })

  it('should throw error if query execution fails', async () => {
    permissionForFullReferenceNumber.mockResolvedValueOnce({ filter: 'coffee' })
    const error = 'Wuh-oh!'
    executeQuery.mockImplementationOnce(() => {
      throw new Error(error)
    })
    const request = getMockRequest({})
    const responseToolkit = getMockResponseToolkit()

    await expect(permissionRenewalData[0].options.handler(request, responseToolkit)).rejects.toThrow(error)
  })
})
