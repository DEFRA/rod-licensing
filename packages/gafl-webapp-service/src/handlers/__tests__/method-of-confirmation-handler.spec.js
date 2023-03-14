import handler from '../method-of-confirmation-handler.js'
// import { MOCK_EXISTING_CONTACT_ENTITY } from '../../../../sales-api-service/src/__mocks__/test-data.js'

// jest.mock('../../../../sales-api-service/src/services/contacts.service.js', () => ({
//   ...jest.requireActual('../../../../sales-api-service/src/services/contacts.service.js'),
//   getExistingContacts: () => MOCK_EXISTING_CONTACT_ENTITY
// }))

describe('The agreed handler', () => {
  beforeEach(jest.clearAllMocks)

  const mockTransactionSet = jest.fn()

  const getSamplePermission = ({ shortTermPreferredMethodOfConfirmation } = {}) => ({
    licensee: {
      birthDate: '2000-01-01',
      firstName: 'First',
      lastName: 'Last',
      postcode: 'AB12 1AB',
      shortTermPreferredMethodOfConfirmation: shortTermPreferredMethodOfConfirmation,
      preferredMethodOfReminder: 'Email',
      email: 'email@example.com',
      postalFulfilment: false
    }
  })

  const getMockRequest = () => ({
    cache: () => ({
      helpers: {
        transaction: {
          setCurrentPermission: mockTransactionSet
        }
      }
    })
  })

  it.only('no contact found in CRM then preferredMethodOfConfirmation is set to same value as shortTermPreferredMethodOfConfirmation', async () => {
    await handler(getMockRequest(), getSamplePermission('text'))
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredMethodOfConfirmation: 'text'
      })
    )
  })

  it('contact found in CRM so preferredMethodOfConfirmation is set to same value as existing contact', async () => {

  })

  it('findContactInCRM is called with permission.licensee', async () => {

  })

  it('setCurrentPermission is called with permission', async () => {

  })
})
