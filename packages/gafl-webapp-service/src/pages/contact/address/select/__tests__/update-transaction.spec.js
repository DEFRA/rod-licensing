import updateTransaction from '../update-transaction.js'
import { licenceDetailsService } from '../../../../../services/licence-details/licence-details-service.js'

jest.mock('../../../../../services/licence-details/licence-details-service.js')

describe('update-transaction', () => {
  const generateMockRequest = ({ licensee = {}, postcode = '', setExistingPermissions = () => {} } = {}) => ({
    cache: () => ({
      helpers: {
        page: { getCurrentPermission: () => ({ payload: { address: 'a1' } }) },
        transaction: { getCurrentPermission: () => ({ licensee }), setCurrentPermission: () => {} },
        addressLookup: { getCurrentPermission: () => ({ addresses: [{ id: 'a1', postcode }] }) },
        existingPermissions: { set: setExistingPermissions }
      }
    })
  })

  it('sends correct parameters to look up existing permissions', async () => {
    const sampleLicensee = {
      firstName: 'Brenin',
      lastName: 'Pysgotwr',
      birthDate: '1987-07-10'
    }
    const postcode = 'YO99 9AA'

    await updateTransaction(generateMockRequest({ licensee: sampleLicensee, postcode }))
    expect(licenceDetailsService).toHaveBeenCalledWith(
      sampleLicensee.firstName,
      sampleLicensee.lastName,
      sampleLicensee.birthDate,
      postcode
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
})
