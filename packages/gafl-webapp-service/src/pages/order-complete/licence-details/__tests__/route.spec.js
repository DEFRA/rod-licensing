import { getData } from '../route.js'
import Boom from '@hapi/boom'
import { COMPLETION_STATUS, CommonResults, ShowDigitalLicencePages } from '../../../../constants.js'
import { CONCESSION, CONCESSION_PROOF, LICENCE_TYPE } from '../../../../processors/mapping-constants.js'
import * as dtDisplay from '../../../../processors/date-and-time-display.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../../processors/licence-type-display.js'
import * as concessionHelper from '../../../../processors/concession-helper.js'
import { SENIOR_AGE_CHANGE_DATE } from '@defra-fish/business-rules-lib'
import moment from 'moment-timezone'

jest.mock('../../../../processors/concession-helper.js')
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
  },
  MultibuyForYou: {
    YES: 'yes',
    NO: 'no'
  }
}))

jest.mock('@hapi/boom', () => ({
  forbidden: () => {
    Symbol('403 Forbidden error')
  }
}))

describe('The licence details page', () => {
  describe('.getData', () => {
    licenceTypeAndLengthDisplay.mockReturnValue('length')
    describe('throws a Boom forbidden error', () => {
      it('test that boom is called when no status flag is set', async () => {
        expect(async () => await getData(createMockRequest({}, {}))).rejects.toThrow(Boom)
      })

      it.each([
        {
          status: {},
          boomError: 'Attempt to access the licence information handler with no agreed flag set',
          description: 'status agreed flag is not set'
        },
        {
          status: { [COMPLETION_STATUS.agreed]: 'agreed' },
          boomError: 'Attempt to access the licence information handler with no posted flag set',
          description: 'status posted flag is not set'
        },
        {
          status: { [COMPLETION_STATUS.agreed]: 'agreed', [COMPLETION_STATUS.posted]: 'posted' },
          boomError: 'Attempt to access the licence information handler with no finalised flag set',
          description: 'status finalised flag is not set'
        }
      ])('boom error thrown if $description', async ({ status, boomError }) => {
        expect(async () => await getData(createMockRequest(status, {}))).rejects.toThrow(boomError)
      })
    })

    it('calls licenceTypeDisplay with permission and i18n catalog', async () => {
      const i18nCatalog = Symbol('mock catalog')
      const permission = getSamplePermission()

      const sampleRequest = createMockRequest({ permission, i18nCatalog })

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, i18nCatalog)
    })

    it('licenceTypeAndLengthDisplay is called with permission and i18n catalog', async () => {
      const i18nCatalog = getSampleCatalog()
      const permission = getSamplePermission()

      const sampleRequest = createMockRequest(getSampleTransaction([permission]))

      await getData(sampleRequest)

      expect(licenceTypeAndLengthDisplay).toHaveBeenCalledWith(permission, i18nCatalog)
    })

    it('return value of licenceTypeDisplay is used for type', async () => {
      const licenceDisplay = Symbol('licence display')
      licenceTypeDisplay.mockReturnValueOnce(licenceDisplay)

      const result = await getData(createMockRequest())

      expect(result.licences[0].type).toBe(licenceDisplay)
    })

    it('calls concessionHelper.hasDisabled with current permission', async () => {
      const permission = getSamplePermission()
      const mockTransaction = { ...getSampleTransaction(), permissions: [permission] }
      const request = createMockRequest({ transaction: mockTransaction })
      await getData(request)

      expect(concessionHelper.hasDisabled).toHaveBeenCalledWith(permission)
    })

    it('returns value of concessionHelper.hasDisabled for disabled', async () => {
      const returnValue = Symbol('return value')
      concessionHelper.hasDisabled.mockReturnValueOnce(returnValue)

      const data = await getData(createMockRequest())

      expect(data.licences[0].disabled).toBe(returnValue)
    })

    it.each(['displayStartTime', 'displayEndTime'])('calls %s with request and permission', async method => {
      const permission = getSamplePermission()
      const mockTransaction = { ...getSampleTransaction(), permissions: [permission] }
      const request = createMockRequest({ transaction: mockTransaction })
      await getData(request)
      expect(dtDisplay[method]).toHaveBeenCalledWith(request, permission)
    })

    it.each([
      ['displayStartTime', 'start'],
      ['displayEndTime', 'end']
    ])('returns value of %s for %s', async (method, key) => {
      const returnValue = Symbol('return value')
      dtDisplay[method].mockReturnValueOnce(returnValue)
      const data = await getData(createMockRequest())
      expect(data.licences[0][key]).toBe(returnValue)
    })

    it.each([
      { desc: 'senior', method: 'hasSenior', catKey: 'age_senior_concession' },
      { desc: 'junior', method: 'hasJunior', catKey: 'age_junior_concession' }
    ])('returns $desc concession text when age concession is $desc', async ({ method, catKey }) => {
      concessionHelper[method].mockReturnValueOnce(true)
      const ageConcession = Symbol('age concession')
      const mockRequest = createMockRequest({ i18nCatalog: { ...getSampleCatalog(), [catKey]: ageConcession } })
      const result = await getData(mockRequest)
      expect(result.licences[0].ageConcession).toEqual(ageConcession)
    })

    it.each([
      ['on', SENIOR_AGE_CHANGE_DATE, Symbol('Over 66')],
      ['after', moment(SENIOR_AGE_CHANGE_DATE).add(1, 'day').format('YYYY-MM-DD'), Symbol('Over 66')]
    ])('displays age_senior_concession_new for senior concessions starting %s SENIOR_AGE_CHANGE_DATE', async (_d, startDate) => {
      concessionHelper.hasSenior.mockReturnValueOnce(true)
      dtDisplay.displayStartTime.mockReturnValueOnce(startDate)
      const ageConcession = 'New Senior Age Concession Text'
      const i18nCatalog = { ...getSampleCatalog(), age_senior_concession_new: ageConcession }
      const permission = { ...getSamplePermission(), startDate: startDate }
      const mockTransaction = { ...getSampleTransaction(), permissions: [permission] }
      const mockRequest = createMockRequest({ transaction: mockTransaction, i18nCatalog })
      const result = await getData(mockRequest)
      expect(result.licences[0].ageConcession).toEqual(ageConcession)
    })

    it.each([['Salmon and sea trout, 1 day'], ['Salmon and sea trout, 8 days'], ['Salmon and sea trout, 12 months']])(
      'returns licence length as %s',
      async licenceLength => {
        licenceTypeAndLengthDisplay.mockReturnValueOnce(licenceLength)
        const data = await getData(createMockRequest())
        expect(data).toMatchSnapshot()
      }
    )

    it('returns age concession as Senior', async () => {
      const concession = {
        type: 'Senior'
      }
      concessionHelper.hasSenior.mockReturnValueOnce(true)
      concessionHelper.getAgeConcession.mockReturnValue(concession)
      const data = await getData(createMockRequest())
      expect(data).toMatchSnapshot()
    })

    it('returns age concession as Junior', async () => {
      const concession = {
        type: 'Junior'
      }
      concessionHelper.hasJunior.mockReturnValueOnce(true)
      concessionHelper.getAgeConcession.mockReturnValue(concession)
      const data = await getData(createMockRequest())
      expect(data).toMatchSnapshot()
    })

    it('returns age concession as Neither', async () => {
      const concession = {
        type: 'Neither'
      }
      concessionHelper.getAgeConcession.mockReturnValue(concession)
      const data = await getData(createMockRequest())
      expect(data).toMatchSnapshot()
    })

    it('returns the expected data', async () => {
      dtDisplay.displayStartTime.mockReturnValueOnce('1:00am on 6 June 2020')
      dtDisplay.displayEndTime.mockReturnValueOnce('1:00am on 5 June 2021')
      licenceTypeDisplay.mockReturnValueOnce('Shopping trollies and old wellies')
      concessionHelper.hasDisabled.mockReturnValueOnce(true)
      concessionHelper.hasSenior.mockReturnValueOnce(true)
      concessionHelper.getAgeConcession.mockReturnValueOnce({ proof: { type: 'No Proof' }, type: 'Senior' })
      const result = await getData(createMockRequest())
      expect(result).toMatchSnapshot()
    })
  })
})

const getSamplePermission = () => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela',
    obfuscatedDob: 'obfuscatedDob'
  },
  referenceNumber: '123456789',
  licenceLength: '8D',
  permit: { cost: 12 },
  startDate: '2022-06-06',
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

const getSampleCatalog = overrides => ({
  age_senior_concession: 'age_senior_concession',
  age_senior_concession_new: 'age_senior_concession_new',
  age_junior_concession: 'age_junior_concession',
  licence_type_1d: 'licence_type_1d',
  licence_type_8d: 'licence_type_8d',
  licence_type_12m: 'licence_type_12m',
  ...overrides
})

const getSampleTransaction = () => ({
  permissions: [getSamplePermission()]
})

const createMockRequest = ({
  status = {
    [COMPLETION_STATUS.agreed]: true,
    [COMPLETION_STATUS.posted]: true,
    [COMPLETION_STATUS.finalised]: true,
    [CommonResults.OK]: 'ok',
    [ShowDigitalLicencePages.YES]: 'yes'
  },
  transaction = getSampleTransaction(),
  permission = getSamplePermission(),
  i18nCatalog = getSampleCatalog()
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        get: () => status
      },
      transaction: {
        getCurrentPermission: () => permission,
        get: () => transaction
      }
    }
  }),
  i18n: {
    getCatalog: () => i18nCatalog
  }
})
