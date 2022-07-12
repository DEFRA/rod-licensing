import { Permission, Contact, Permit, PoclFile, Transaction } from '../../index.js'

const mockIds = [
  '$45812ea6-991f-41b3-8760-03542f9cc130',
  '$45812ea6-991f-41b3-8760-03542f9cc131',
  '$45812ea6-991f-41b3-8760-03542f9cc132',
  '$45812ea6-991f-41b3-8760-03542f9cc133',
  '$45812ea6-991f-41b3-8760-03542f9cc134',
  '$45812ea6-991f-41b3-8760-03542f9cc135',
  '$45812ea6-991f-41b3-8760-03542f9cc136',
  '$45812ea6-991f-41b3-8760-03542f9cc137',
  '$45812ea6-991f-41b3-8760-03542f9cc138',
  '$45812ea6-991f-41b3-8760-03542f9cc139'
]
jest.mock('uuid', () => ({
  v4: () => {
    if (mockIds.length) {
      return mockIds.pop()
    }
    throw new Error('You need to add some ids to mockIds')
  }
}))

describe('permission entity', () => {
  const getOptionSetData = () => ({
    defra_datasource: {
      name: 'defra_datasource',
      options: {
        99999999: {
          id: '99999999',
          label: 'Door to door sales',
          description: 'Door to door sales'
        },
        99999998: {
          id: '99999998',
          label: 'Direct',
          description: 'Pushy direct marketing'
        }
      }
    },
    defra_islicenceforyou: {
      name: 'defra_islicenceforyou',
      options: {
        0: {
          id: '0',
          label: 'Maybe Not',
          description: 'Perhaps not...'
        },
        1: {
          id: '1',
          label: 'Maybe',
          description: 'Definitely maybe'
        }
      }
    },
    defra_permittype: {
      name: 'defra_permittype',
      options: {
        999999123: {
          id: 999999123,
          label: 'Licence for fishing',
          description: 'Licence for fishing'
        }
      }
    },
    defra_permitsubtype: {
      name: 'defra_permitsubtype',
      options: {
        999999124: {
          id: 999999124,
          label: 'Old Wellies',
          description: 'W'
        },
        999999125: {
          id: 999999124,
          label: 'Shopping trollies',
          description: 'S'
        }
      }
    }
  })

  describe('maps from dynamics', () => {
    const getPermission = () =>
      Permission.fromResponse(
        {
          '@odata.etag': 'W/"186695153"',
          defra_permissionid: '347a9083-361e-ea11-a810-000d3a25c5d6',
          defra_name: '00000000-2WC3FDR-CD379B',
          defra_issuedate: '2019-12-13T09:00:00Z',
          defra_startdate: '2019-12-14T00:00:00Z',
          defra_enddate: '2020-12-13T23:59:59Z',
          defra_stagingid: '71ad9a25-2a03-406b-a0e3-f4ff37799374',
          defra_datasource: 99999999,
          defra_licenceforyou: 1,
          defra_ismultibuy: true
        },
        getOptionSetData()
      )

    it('is a Permission instance', () => {
      expect(getPermission()).toBeInstanceOf(Permission)
    })

    it.each([
      getPermission(),
      Permission.fromResponse(
        {
          '@odata.etag': 'W/"645930475"',
          defra_permissionid: '8jue9j89-309d-lk23-j892-0fger0f9009d',
          defra_name: '56787656-3TC3FFR-HJ789F',
          defra_issuedate: '2021-06-30T22:23:15Z',
          defra_startdate: '2021-06-30T22:53:15Z',
          defra_enddate: '2022-06-30T22:53:15Z',
          defra_stagingid: '7f9d97df-b547-4c52-9bc8-0b98a7fb06f8',
          defra_datasource: 910400003,
          defra_licenceforyou: 0,
          defra_ismultibuy: false
        },
        getOptionSetData()
      )
    ])('matches JSON representation', () => {
      const json = JSON.parse(getPermission().toString())
      expect(json).toMatchSnapshot()
    })
  })

  it('maps to dynamics', async () => {
    // Mimic a permit which is already persisted to test binding
    const permit = Permit.fromResponse(
      {
        '@odata.etag': 'W/"22639016"',
        defra_availablefrom: '2017-03-31T23:00:00Z',
        defra_availableto: '2020-03-31T22:59:00Z',
        defra_duration: 910400000,
        defra_permittype: 910400000,
        defra_advertisedprice: 6.0,
        defra_permitid: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
        defra_name: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
        defra_permitsubtype: 910400000,
        defra_equipment: 910400000,
        defra_isforfulfilment: false,
        defra_iscountersales: true,
        defra_advertisedprice_base: 6.0,
        defra_itemid: '42289'
      },
      getOptionSetData()
    )
    // Mimic a new contact to test binding
    const contact = new Contact()
    // Mimic a new transaction to test binding
    const transaction = new Transaction()
    const poclFile = new PoclFile()

    const permission = new Permission()
    permission.referenceNumber = '00000000-2WC3FDR-CD379B'
    permission.issueDate = '2019-12-13T09:00:00Z'
    permission.startDate = '2019-12-14T00:00:00Z'
    permission.endDate = '2020-12-13T23:59:59Z'
    permission.stagingId = '71ad9a25-2a03-406b-a0e3-f4ff37799374'
    permission.dataSource = { id: '99999999', label: 'Door to Door', description: 'Door to door sales' }
    permission.isLicenceForYou = { id: '1', label: 'Might be', description: 'Definitely maybe' }
    permission.isMultiBuy = true

    permission.bindToEntity(Permission.definition.relationships.licensee, contact)
    permission.bindToEntity(Permission.definition.relationships.permit, permit)
    permission.bindToEntity(Permission.definition.relationships.transaction, transaction)
    permission.bindToEntity(Permission.definition.relationships.poclFile, poclFile)

    const dynamicsEntity = permission.toRequestBody()

    expect(dynamicsEntity).toMatchSnapshot()
  })
})
