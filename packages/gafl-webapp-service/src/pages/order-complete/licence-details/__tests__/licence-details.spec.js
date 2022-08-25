import { getData } from '../route.js'
import Boom from '@hapi/boom'
import { COMPLETION_STATUS } from '../../../../constants.js'
import { CONCESSION, CONCESSION_PROOF, LICENCE_TYPE } from '../../../../processors/mapping-constants.js'

beforeEach(jest.clearAllMocks)

describe('The licence details page', () => {
  describe('.getData', () => {
    describe('throws a Boom forbidden error', () => {
      it('if status agreed flag is not set', async () => {
        const mockRequest = createMockRequest({})
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no agreed flag set')
        await expect(getData(mockRequest)).rejects.toThrow(boomError)
      })

      it('if status posted flag is not set', async () => {
        const mockRequest = createMockRequest({ [COMPLETION_STATUS.agreed]: true })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no posted flag set')
        await expect(getData(mockRequest)).rejects.toThrow(boomError)
      })

      it('if status finalised flag is not set', async () => {
        const mockRequest = createMockRequest({ [COMPLETION_STATUS.agreed]: true, [COMPLETION_STATUS.posted]: true })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no finalised flag set')
        await expect(getData(mockRequest)).rejects.toThrow(boomError)
      })
    })

    it('returns the expected data', async () => {
      const mockRequest = createMockRequest({
        [COMPLETION_STATUS.agreed]: true,
        [COMPLETION_STATUS.posted]: true,
        [COMPLETION_STATUS.finalised]: true
      })
      const result = await getData(mockRequest)
      expect(result).toMatchSnapshot()
    })
  })
})

const createMockRequest = status => ({
  cache: jest.fn(() => ({
    helpers: {
      status: {
        get: jest.fn(() => status)
      },
      transaction: {
        getCurrentPermission: jest.fn(() => ({
          startDate: '2020-06-06',
          endDate: '2021-06-05',
          licenceType: LICENCE_TYPE['trout-and-coarse'],
          numberOfRods: '3',
          concessions: [
            {
              type: CONCESSION.DISABLED,
              proof: {
                type: CONCESSION_PROOF.blueBadge,
                referenceNumber: '123456324'
              }
            },
            {
              type: CONCESSION.SENIOR,
              proof: {
                type: CONCESSION_PROOF.none
              }
            }
          ]
        }))
      }
    }
  })),
  i18n: {
    getCatalog: () => ({
      over_65: 'Over 65',
      licence_type_radio_trout_three_rod: 'Trout and coarse, up to 3 rods',
      renewal_start_date_expires_5: 'on'
    })
  }
})
