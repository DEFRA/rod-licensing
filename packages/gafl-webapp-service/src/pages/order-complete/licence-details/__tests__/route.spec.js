import { getData } from '../route.js'
import Boom from '@hapi/boom'
import { COMPLETION_STATUS } from '../../../../constants.js'
import { CONCESSION, CONCESSION_PROOF, LICENCE_TYPE } from '../../../../processors/mapping-constants.js'
import * as dtDisplay from '../../../../processors/date-and-time-display.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import * as concessionHelper from '@defra-fish/business-rules-lib'

beforeEach(jest.clearAllMocks)
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../constants.js', () => ({
  COMPLETION_STATUS: {
    agreed: 'agreed',
    posted: 'posted',
    finalised: 'finalised'
  },
  CommonResults: {
    ok: 'ok'
  },
  ShowDigitalLicencePages: {
    YES: 'yes'
  }
}))
jest.mock('@defra-fish/business-rules-lib')

describe('The licence details page', () => {
  describe('.getData', () => {
    describe('throws a Boom forbidden error', () => {
      it('if status agreed flag is not set', async () => {
        const mockRequest = createMockRequest({ status: {} })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no agreed flag set')
        await expect(getData(mockRequest)).rejects.toThrow(boomError)
      })

      it('if status posted flag is not set', async () => {
        const mockRequest = createMockRequest({ status: { [COMPLETION_STATUS.agreed]: true } })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no posted flag set')
        await expect(getData(mockRequest)).rejects.toThrow(boomError)
      })

      it('if status finalised flag is not set', async () => {
        const mockRequest = createMockRequest({ status: { [COMPLETION_STATUS.agreed]: true, [COMPLETION_STATUS.posted]: true } })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no finalised flag set')
        await expect(getData(mockRequest)).rejects.toThrow(boomError)
      })
    })

    it('calls licenceTypeDisplay with permission and i18n catalog', async () => {
      const i18nCatalog = Symbol('mock catalog')
      const permission = Symbol('mock permission')

      const sampleRequest = createMockRequest({ permission, i18nCatalog })

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, i18nCatalog)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const licenceDisplay = Symbol('licence display')
      licenceTypeDisplay.mockReturnValueOnce(licenceDisplay)

      const { licenceTypeStr } = await getData(createMockRequest())

      expect(licenceTypeStr).toBe(licenceDisplay)
    })

    it.each(['hasDisabled', 'getAgeConcession'])('calls concessionHelper.%s with current permission', async method => {
      const permission = Symbol('mock permission')
      await getData(createMockRequest({ permission }))

      expect(concessionHelper[method]).toHaveBeenCalledWith(permission)
    })

    it.each([
      ['hasDisabled', 'disabled'],
      ['getAgeConcession', 'ageConcession']
    ])('returns value of concessionHelper.%s for %s', async (method, key) => {
      const returnValue = Symbol('return value')
      concessionHelper[method].mockReturnValueOnce(returnValue)

      const data = await getData(createMockRequest())

      expect(data[key]).toBe(returnValue)
    })

    it.each(['displayStartTime', 'displayEndTime'])('calls %s with request and permission', async method => {
      const permission = Symbol('mock permission')
      const request = createMockRequest({ permission })
      await getData(request)
      expect(dtDisplay[method]).toHaveBeenCalledWith(request, permission)
    })

    it.each([
      ['displayStartTime', 'startTimeString'],
      ['displayEndTime', 'endTimeString']
    ])('calls %s with request and permission', async (method, key) => {
      const returnValue = Symbol('return value')
      dtDisplay[method].mockReturnValueOnce(returnValue)
      const data = await getData(createMockRequest())
      expect(data[key]).toBe(returnValue)
    })

    it.each([
      { desc: 'senior', method: 'hasSenior', catKey: 'age_senior_concession' },
      { desc: 'junior', method: 'hasJunior', catKey: 'age_junior_concession' }
    ])('returns $desc concession text when age concession is $desc', async ({ method, catKey }) => {
      concessionHelper[method].mockReturnValueOnce(true)
      const ageConcession = Symbol('age concession')
      const mockRequest = createMockRequest({ i18nCatalog: { ...getSampleCatalog(), [catKey]: ageConcession } })
      const { ageConcessionText } = await getData(mockRequest)
      expect(ageConcessionText).toBe(ageConcession)
    })

    it('returns the expected data', async () => {
      const mockRequest = createMockRequest()
      dtDisplay.displayStartTime.mockReturnValueOnce('1:00am on 6 June 2020')
      dtDisplay.displayEndTime.mockReturnValueOnce('1:00am on 5 June 2021')
      licenceTypeDisplay.mockReturnValueOnce('Shopping trollies and old wellies')
      concessionHelper.hasDisabled.mockReturnValueOnce(true)
      concessionHelper.hasSenior.mockReturnValueOnce(true)
      concessionHelper.getAgeConcession.mockReturnValueOnce({ proof: { type: 'No Proof' }, type: 'Senior' })
      const result = await getData(mockRequest)
      expect(result).toMatchSnapshot()
    })
  })
})

const getSamplePermission = () => ({
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
})

const getSampleCatalog = () => ({
  age_senior_concession: 'age_senior_concession',
  age_junior_concession: 'age_junior_concession'
})

const createMockRequest = ({
  status = { [COMPLETION_STATUS.agreed]: true, [COMPLETION_STATUS.posted]: true, [COMPLETION_STATUS.finalised]: true },
  permission = getSamplePermission(),
  i18nCatalog = getSampleCatalog()
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        get: () => status
      },
      transaction: {
        getCurrentPermission: () => permission
      }
    }
  }),
  i18n: {
    getCatalog: () => i18nCatalog
  }
})
