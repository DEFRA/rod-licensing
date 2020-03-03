import { Permit } from '../../index'

describe('permit entity', () => {
  it('maps from dynamics', async () => {
    const permit = Permit.fromResponse({
      '@odata.etag': 'W/"22639016"',
      defra_availablefrom: '2017-03-31T23:00:00Z',
      defra_availableto: '2020-03-31T22:59:00Z',
      'defra_duration@OData.Community.Display.V1.FormattedValue': '1 day',
      defra_duration: 910400000,
      'defra_permittype@OData.Community.Display.V1.FormattedValue': 'Rod Fishing Licence',
      defra_permittype: 910400000,
      defra_advertisedprice: 6.0,
      defra_permitid: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
      defra_name: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
      'defra_permitsubtype@OData.Community.Display.V1.FormattedValue': 'Trout and coarse',
      defra_permitsubtype: 910400001,
      'defra_equipment@OData.Community.Display.V1.FormattedValue': 'Up to 2 rods',
      defra_equipment: 910400000,
      defra_isforfulfilment: false,
      defra_iscountersales: true,
      defra_advertisedprice_base: 6.0,
      defra_itemid: '42289'
    })
    const expectedFields = {
      id: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
      description: '2017-20 Coarse 1 day 2 Rod Licence (Full)',
      permitId: '9d1b34a0-0c66-e611-80dc-c4346bad0190',
      permitTypeId: 910400000,
      permitType: 'Rod Fishing Licence',
      permitSubtypeId: 910400001,
      permitSubtype: 'Trout and coarse',
      durationId: 910400000,
      duration: '1 day',
      equipmentId: 910400000,
      equipment: 'Up to 2 rods',
      availableFrom: '2017-03-31T23:00:00Z',
      availableTo: '2020-03-31T22:59:00Z',
      isForFulfilment: false,
      isCounterSales: true,
      cost: 6,
      itemId: '42289'
    }

    expect(permit).toBeInstanceOf(Permit)
    expect(permit).toMatchObject(expect.objectContaining({ etag: 'W/"22639016"', ...expectedFields }))
    expect(permit.toString()).toMatchObject(expect.objectContaining(expectedFields))
  })
})
