import { getData } from '../route.js'
import { nextPage } from '../../../../routes/next-page.js'
import pageRoute from '../../../../routes/page-route.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { CONTACT } from '../../../../uri.js'

jest.mock('../../../../routes/page-route.js')
// arbitrary duration of existing licence
const TEN_MONTHS = 10 * 30 * 24 * 60 * 60 * 1000

const endDates = (offset = TEN_MONTHS) => {
    const d = new Date();
    const dates= {
      midday: new Date(d.getTime() + offset),
      midnight: new Date( d.getTime() + offset)
    }
    dates.midday.setUTCHours(12, 0, 0, 0)
    dates.midnight.setUTCHours(0, 0, 0, 0)
    return (dates)
}


const createLicence = ({ subtype = 'C', numberOfRods = 3, endDate = new Date() } = {}) => ({
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

const getMessages = () => ({
  interrupt_title: "Your current licence",
  interrupt_important: "Important",
  interrupt_you_have_1: "You already have a ",
  interrupt_name_has_1: "name has 1",
  interrupt_name_has_2: "name has 2",
  interrupt_name_has_3: "name has 3",
  interrupt_trout_and_coarse_licence: "trout and coarse licence",
  interrupt_salmon_and_sea_trout_licence: "salmon and sea trout licence",
  interrupt_covered_rods: "This licence also covers you for trout and coarse (up to 3 rods)",
  interrupt_your_current_licence: "Your current licence",
  interrupt_licence_type: "Licence type",
  interrupt_length: "Length",
  interrupt_end: "Ends",
  interrupt_view_licence_details: "View licence details",
  interrupt_could_face_prosecution: "You could face prosecution and a fine if you fish with more than 4 rods and lines",
  interrupt_find_rules: "Find out which rod fishing rules apply in your area (opens in new tab)",
  interrupt_continue_purchase: "Continue with purchase",
  licence_type_radio_salmon: "Salmon and sea trout",
  licence_type_radio_salmon_payment_summary: "Salmon and sea trout",
  licence_type_radio_trout_three_rod: "Trout and coarse (up to 3 rods)",
  licence_type_radio_trout_three_rod_payment_summary: "Trout and coarse (up to 3 rods)",
  licence_type_radio_trout_two_rod: "Trout and coarse (up to 2 rods)",
  licence_type_radio_trout_two_rod_payment_summary: "Trout and coarse (up to 2 rods)",
})

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
    getCatalog: () => getMessages()
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
      [[createLicence()], 1],
      [[createLicence(), createLicence(), createLicence()], 3]
    ])('returns an array of licences of the correct length', async (permissions, expectedCount) => {
      const existingPermissions = { permissions }
      const currentPermission = createCurrentPermission()
      const result = await getData(getSampleRequest(existingPermissions, currentPermission))
      expect(result.licences.length).toEqual(expectedCount)
    })

    it('places a salmon and trout licence first if present', async () => {
      const mssgs = getMessages();
      const { midnight, midday } = endDates();
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
