import { getData } from '../route.js'
import { nextPage } from '../../../../routes/next-page.js'
import pageRoute from '../../../../routes/page-route.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { CONTACT } from '../../../../uri.js'
import mssgs from '../../../../locales/en.json'

jest.mock('../../../../routes/page-route.js')
// arbitrary duration of existing licence
const TEN_MONTHS = 10 * 30 * 24 * 60 * 60 * 1000

const startDate = new Date()
const finishDate = new Date()
finishDate.setTime(startDate.getTime() + TEN_MONTHS)
const midday = new Date(finishDate.getTime())
const midnight = new Date(finishDate.getTime())

midday.setUTCHours(12, 0, 0, 0)
midnight.setUTCHours(0, 0, 0, 0)

const createLicence = ({ subtype = 'C', numberOfRods = 3, endDate = finishDate } = {}) => ({
  endDate: endDate.toISOString(),
  permit: {
    permitSubtype: { description: subtype },
    durationMagnitude: 12,
    numberOfRods
  }
})

const createCurrentPermission = () => ({
  isLicenceForYou: false,
  licensee: {
    firstName: 'First',
    lastName: 'Last'
  }
})

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
    it('redirects to the licence fulfilment page if there are no existing licences', async () => {
      const existingPermissions = { permissions: [] }
      const currentPermission = createCurrentPermission()
      const getDataRedirectError = new GetDataRedirect(CONTACT.uri)
      const func = async () => await getData(getSampleRequest(existingPermissions, currentPermission))
      await expect(func).rejects.toThrow(getDataRedirectError)
    })

    it.each([
      [[createLicence({ subtype: 'S', endDate: midday })], 1],
      [[createLicence({ numberOfRods: 2 }), createLicence({ endDate: midnight }), createLicence({ subtype: 'S', endDate: midday })], 3]
    ])('returns expected values', async (permissions, expectedCount) => {
      const existingPermissions = { permissions }
      const currentPermission = createCurrentPermission()
      const result = await getData(getSampleRequest(existingPermissions, currentPermission))
      expect(result.licences.length).toEqual(expectedCount)
    })

    it('places a salmon and trout licence first if present', async () => {
      const existingPermissions = {
        permissions: [
          createLicence({ numberOfRods: 2 }),
          createLicence({ subtype: 'S', endDate: midday }),
          createLicence({ endDate: midnight }),
          createLicence({ subtype: 'S', endDate: midday }),
          createLicence({ endDate: midnight })
        ]
      }
      const currentPermission = createCurrentPermission()

      const result = await getData(getSampleRequest(existingPermissions, currentPermission))
      expect(result.licences).toMatchObject([
        expect.objectContaining({
          licenceType: mssgs.licence_type_radio_salmon,
          isSalmon: true,
          ends: expect.objectContaining({ time: '12:00pm (midday)' })
        }),
        expect.objectContaining({
          licenceType: mssgs.licence_type_radio_salmon,
          isSalmon: true,
          ends: expect.objectContaining({ time: '12:00pm (midday)' })
        }),
        expect.objectContaining({
          numberOfRods: 3,
          licenceType: mssgs.licence_type_radio_trout_three_rod,
          isSalmon: false,
          ends: expect.objectContaining({ time: '11:59pm' })
        }),
        expect.objectContaining({
          numberOfRods: 3,
          licenceType: mssgs.licence_type_radio_trout_three_rod,
          isSalmon: false,
          ends: expect.objectContaining({ time: '11:59pm' })
        }),
        expect.objectContaining({
          numberOfRods: 2,
          licenceType: mssgs.licence_type_radio_trout_two_rod,
          isSalmon: false
        })
      ])
    })
    it('returns an empty licence type for a licence with an unrecognised permit subtype', async () => {
      const existingPermissions = {
        permissions: [createLicence({ subtype: 'W' })]
      }
      const currentPermission = createCurrentPermission()
      const result = await getData(getSampleRequest(existingPermissions, currentPermission))
      expect(result.licences).toMatchObject([
        expect.objectContaining({
          licenceType: ''
        })
      ])
    })
  })
})
