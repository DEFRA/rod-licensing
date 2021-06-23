import { getData } from '../route.js'
import { createMockRequest } from '../../../../__mocks__/request-cache'

import { licenceTypeDisplay, licenceLengthDisplay } from '../../../../processors/licence-type-display.js'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'

jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')

licenceTypeDisplay.mockReturnValue('Trout and coarse, up to 2 rods')
licenceLengthDisplay.mockReturnValue('8 days')
displayStartTime.mockReturnValue('9:32am on 23 June 2021')

const permission = {
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: 'trout-and-coarse',
  numberOfRods: '2',
  licenceLength: '8D',
  permit: { cost: 12 }
}

describe('The view licences route .getData', () => {
  let data
  beforeAll(async () => {
    const request = createMockRequest({
      cache: { transaction: {
        permissions: [permission]
      }}
    })

    data = await getData(request)
  })
  describe('returns expected licence data for the given permission:', () => {
    it('licenceHolder', async () => {
      expect(data.licences[0].licenceHolder).toBe('Turanga Leela')
    })

    it('type', async () => {
      expect(data.licences[0].type).toBe('Trout and coarse, up to 2 rods')
    })

    it('length', async () => {
      expect(data.licences[0].length).toBe('8 days')
    })

    it('start', async () => {
      expect(data.licences[0].start).toBe('9:32am on 23 June 2021')
    })

    it('price', async () => {
      expect(data.licences[0].price).toBe(permission.permit.cost)
    })
    
    it('index', async () => {
      expect(data.licences[0].index).toBe(0)
    })
  })
})