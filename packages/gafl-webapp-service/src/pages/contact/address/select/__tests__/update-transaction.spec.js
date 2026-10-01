import updateTransaction from '../update-transaction.js'
import { licenceDetailsService } from '../../../../../services/licence-details/licence-details-service.js'

jest.mock('../../../../../services/licence-details/licence-details-service.js', () => ({ licenceDetailsService: jest.fn(() => []) }))

describe('update-transaction', () => {
  const generateMockRequest = ({ licensee = {}, licenceLength = '12M', postcode = '', setExistingPermissions = () => {} } = {}) => ({
    cache: () => ({
      helpers: {
        page: { getCurrentPermission: () => ({ payload: { address: 'a1' } }) },
        transaction: { getCurrentPermission: () => ({ licensee, licenceLength }), setCurrentPermission: () => {} },
        addressLookup: { getCurrentPermission: () => ({ addresses: [{ id: 'a1', postcode }] }) },
        existingPermissions: { set: setExistingPermissions }
      }
    })
  })

  beforeEach(jest.clearAllMocks)

  it('sends correct parameters to look up existing permissions', async () => {
    const sampleLicensee = {
      firstName: 'Brenin',
      lastName: 'Pysgotwr',
      birthDate: '1987-07-10'
    }
    const postcode = 'YO99 9AA'

    await updateTransaction(generateMockRequest({ licensee: sampleLicensee, postcode }))
    expect(licenceDetailsService).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: sampleLicensee.firstName,
        lastName: sampleLicensee.lastName,
        birthDate: sampleLicensee.birthDate,
        postcode
      })
    )
  })

  it('saves retrieved permissions in existingPermissions cache', async () => {
    const setExistingPermissions = jest.fn()
    const sampleRequest = generateMockRequest({ setExistingPermissions })
    const existingPermissions = Symbol('existingPermissions')
    licenceDetailsService.mockReturnValueOnce(existingPermissions)

    await updateTransaction(sampleRequest)

    expect(setExistingPermissions).toHaveBeenCalledWith(existingPermissions)
  })

  describe.each([
    ['one day', '1D'],
    ['eight days', '8D']
  ])('for licence duration %s', (_d, licenceLength) => {
    it("doesn't look up existingPermissions", async () => {
      const sampleRequest = generateMockRequest({ licenceLength })

      await updateTransaction(sampleRequest)

      expect(licenceDetailsService).not.toHaveBeenCalled()
    })

    it("doesn't set existingPermissions cache", async () => {
      const setExistingPermissions = jest.fn()
      const sampleRequest = generateMockRequest({ licenceLength, setExistingPermissions })

      await updateTransaction(sampleRequest)

      expect(setExistingPermissions).not.toHaveBeenCalled()
    })
  })
})
