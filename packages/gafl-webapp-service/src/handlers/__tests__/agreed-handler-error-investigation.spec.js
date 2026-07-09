import agreedHandler from '../agreed-handler'
import { COMPLETION_STATUS } from '../../constants.js'

jest.mock('@defra-fish/connectors-lib')
jest.mock('../../processors/refdata-helper.js', () => ({
  countries: {
    getAll: async () => []
  }
}))

describe('agreed handler error investigation', () => {
  it('error thrown', async () => {
    const request = {
      cache: () => ({
        helpers: {
          status: {
            get: async () => ({
              [COMPLETION_STATUS.agreed]: true,
              permissions: [
                {
                  currentPage: 'choose-payment',
                  'licence-for': true,
                  'choose-payment': true
                }
              ],
              currentPermissionIdx: 0
            })
          },
          transaction: {
            get: async () => ({
              payment: {},
              permissions: [
                {
                  licensee: {},
                  isLicenceForYou: true
                }
              ],
              id: '8e095950-4f7e-4279-b330-27b887ebaf8f'
            })
          }
        }
      })
    }
    await agreedHandler(request, { redirectWithLanguageCode: () => {}, redirect: () => {} })
  })
})
