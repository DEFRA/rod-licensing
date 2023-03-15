import handler from '../method-of-confirmation-handler.js'
import { salesApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib')

describe('The method of confirmation handler', () => {
  beforeEach(jest.clearAllMocks)

  const mockTransactionSet = jest.fn()

  const getSamplePermission = ({ shortTermPreferredMethodOfConfirmation = 'Text' } = {}) => ({
    licensee: {
      birthDate: '2000-01-01',
      firstName: 'First',
      lastName: 'Last',
      postcode: 'AB12 1AB',
      premises: 'Example',
      shortTermPreferredMethodOfConfirmation
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

  it.each([['Email'], ['Text'], ['Prefer not to be contacted']])(
    'no contact found in CRM then preferredMethodOfConfirmation is set to same value as shortTermPreferredMethodOfConfirmation',
    async shortTermPreferredMethodOfConfirmation => {
      salesApi.contacts.find.mockReturnValueOnce(undefined)
      await handler(getMockRequest(), getSamplePermission({ shortTermPreferredMethodOfConfirmation }))
      expect(mockTransactionSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licensee: {
            birthDate: '2000-01-01',
            firstName: 'First',
            lastName: 'Last',
            postcode: 'AB12 1AB',
            preferredMethodOfConfirmation: shortTermPreferredMethodOfConfirmation,
            premises: 'Example',
            shortTermPreferredMethodOfConfirmation: shortTermPreferredMethodOfConfirmation
          }
        })
      )
    }
  )

  it.each([['Email'], ['Text'], ['Prefer not to be contacted']])(
    'contact found in CRM so preferredMethodOfConfirmation is set to same value as existing contact',
    async preferredMethodOfConfirmation => {
      const licensee = {
        birthDate: '2000-01-01',
        firstName: 'First',
        lastName: 'Last',
        postcode: 'AB12 1AB',
        premises: 'Newcastle',
        preferredMethodOfConfirmation: preferredMethodOfConfirmation
      }
      salesApi.contacts.find.mockReturnValueOnce(licensee)
      await handler(getMockRequest(), getSamplePermission('Text'))
      expect(mockTransactionSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licensee: {
            birthDate: '2000-01-01',
            firstName: 'First',
            lastName: 'Last',
            postcode: 'AB12 1AB',
            preferredMethodOfConfirmation: preferredMethodOfConfirmation,
            premises: 'Example',
            shortTermPreferredMethodOfConfirmation: 'Text'
          }
        })
      )
    }
  )
})
