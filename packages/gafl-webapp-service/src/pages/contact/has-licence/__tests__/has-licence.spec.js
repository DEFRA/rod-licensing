import { getData } from '../route.js'
import { nextPage } from '../../../../routes/next-page.js'
import pageRoute from '../../../../routes/page-route.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { CONTACT } from '../../../../uri.js'
import mssgs from '../../../../locales/en.json'

jest.mock('../../../../routes/page-route.js')
// arbitrary duration of existing licence
const TEN_MONTHS =  10 * 30 * 24 * 60 * 60 * 1000

const startDate = new Date()
const finishDate = new Date()
finishDate.setTime(startDate.getTime() + TEN_MONTHS)

const badLicence = {
  startDate: startDate.toISOString(),
  endDate: finishDate.toISOString(),
  permit: {
    permitType: {
      id: 910400000,
      label: 'Rod Fishing Licence',
      description: ''
    },
    permitSubtype: {
      id: 910400001,
      label: 'Bad Subtype',
      description: 'W'
    },
    description: 'Bad Licence',
    duration: {
      id: 910400003,
      label: '12 months',
      description: ''
    },
    durationMagnitude: 12,
    numberOfRods: 3,
    isCounterSales: false,
    availableFrom: new Date().toISOString(),
    availableTo: new Date().toISOString()
  }
}

const salmonLicence1 = {
  startDate: startDate.toISOString(),
  endDate: finishDate.toISOString() ,
  permit: {
    permitType: {
      id: 910400000,
      label: 'Rod Fishing Licence',
      description: ''
    },
    permitSubtype: {
      id: 910400001,
      label: 'Salmon and sea trout',
      description: 'S'
    },
    description: 'Coarse 12 month 3 Rod Licence (Senior, Disabled)',
    duration: {
      id: 910400003,
      label: '12 months',
      description: ''
    },
    durationMagnitude: 12,
    numberOfRods: 3,
    isCounterSales: false,
    availableFrom: new Date().toISOString(),
    availableTo: new Date().toISOString()
  }
}

const coarseLicence3 = {
  startDate: startDate.toISOString(),
  endDate: finishDate.toISOString(),
  permit: {
    permitType: {
      id: 910400000,
      label: 'Rod Fishing Licence',
      description: ''
    },
    permitSubtype: {
      id: 910400001,
      label: 'Trout and coarse',
      description: 'C'
    },
    description: 'Coarse 12 month 3 Rod Licence',
    duration: {
      id: 910400003,
      label: '12 months',
      description: ''
    },
    durationMagnitude: 12,
    numberOfRods: 3,
    isCounterSales: false,
    availableFrom: new Date().toISOString(),
    availableTo: new Date().toISOString()
  }
}

const coarseLicence2 = {
  startDate: startDate.toISOString(),
  endDate: finishDate.toISOString(),
  permit: {
    permitType: {
      id: 910400000,
      label: 'Rod Fishing Licence',
      description: ''
    },
    permitSubtype: {
      id: 910400001,
      label: 'Trout and coarse',
      description: 'C'
    },
    description: 'Coarse 12 month 3 Rod Licence',
    duration: {
      id: 910400003,
      label: '12 months',
      description: ''
    },
    durationMagnitude: 12,
    numberOfRods: 2,
    isCounterSales: false,
    availableFrom: new Date().toISOString(),
    availableTo: new Date().toISOString()
  }
}

const getMessages = mssgs

const getSampleRequest = (existingPermissions = {}, currentPermission = {}) => ({
  cache: () => ({
    helpers: {
      transaction: {
        getCurrentPermission: () => currentPermission
      },
      existingPermissions: {
        get: () => existingPermissions
      }
    }
  }),
  i18n: {
    getCatalog: () => getMessages
  }
})

describe('The existing licence page', () => {
  describe('default', () => {
    it('should call the pageRoute with has-licence, /buy/has-licence, null, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('has-licence', '/buy/has-licence', null, nextPage, getData)
    })
  })

  describe('getData', () => {
    it('redirects if no existing licences', async () => {
      const existingPermissions = { permissions: [] }
      const currentPermission = {
        isLicenceForYou: false,
        licensee: {
          firstName: 'First',
          lastName: 'Last'
        }
      }
      const getDataRedirectError = new GetDataRedirect(CONTACT.uri)
      const func = async () => await getData(getSampleRequest(existingPermissions, currentPermission))
      await expect(func).rejects.toThrow(getDataRedirectError)
    })

    it.each([
      [[salmonLicence1], 1],
      [[coarseLicence2, coarseLicence3, salmonLicence1], 3]
    ])('returns expected values', async (permissions, expectedCount) => {
      const existingPermissions = { permissions }
      const currentPermission = {
        isLicenceForYou: false,
        licensee: {
          firstName: 'First',
          lastName: 'Last'
        }
      }
      const result = await getData(getSampleRequest(existingPermissions, currentPermission))
      expect(result.licences.length).toEqual(expectedCount)
    })

    it('places a salmon and trout licence first if present', async () => {
      const existingPermissions = { permissions: [coarseLicence3, coarseLicence2, salmonLicence1] }
      const currentPermission = {
        isLicenceForYou: false,
        licensee: {
          firstName: 'First',
          lastName: 'Last'
        }
      }
      const result = await getData(getSampleRequest(existingPermissions, currentPermission))
      expect(result.licences.length).toBe(3)

      expect(result.licences[0]).toMatchObject({
        licenceType: mssgs.licence_type_radio_salmon,
        isSalmon: true
      })
      expect(result.licences[1]).toMatchObject({
        numberOfRods: 3,
        licenceType: mssgs.licence_type_radio_trout_three_rod,
        isSalmon: false
      })
      expect(result.licences[2]).toMatchObject({
        numberOfRods: 2,
        licenceType: mssgs.licence_type_radio_trout_two_rod,
        isSalmon: false
      })
    })
    it('handles a bad existing licence', async () => {
      const existingPermissions = { permissions: [badLicence] }
      const currentPermission = {
        isLicenceForYou: false,
        licensee: {
          firstName: 'First',
          lastName: 'Last'
        }
      }
      const result = await getData(getSampleRequest(existingPermissions, currentPermission))
      expect(result.licences.length).toBe(1)
      expect(result.licences[0]).toMatchObject({
        licenceType: ''
      })
    })
  })
})
