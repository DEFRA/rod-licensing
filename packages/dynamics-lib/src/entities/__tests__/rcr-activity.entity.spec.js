import { Contact, RCRActivity, RCR_ACTIVITY_STATUS } from '../../index.js'

describe('rcr activity entity', () => {
  it('maps from dynamics', async () => {
    const rcrActivity = RCRActivity.fromResponse({
      activityid: '1',
      defra_activitystatus: RCR_ACTIVITY_STATUS.STARTED,
      defra_season: 2025,
      actualstart: '2020-03-31T22:59:00Z',
      modifiedon: '2020-03-31T22:59:00Z',
      actualend: '2020-03-31T22:59:00Z'
    })

    const expectedFields = {
      id: '1',
      status: RCR_ACTIVITY_STATUS.STARTED,
      season: 2025,
      lastUpdated: '2020-03-31T22:59:00Z',
      startDate: '2020-03-31T22:59:00Z',
      submittedDate: '2020-03-31T22:59:00Z'
    }

    expect(rcrActivity.toJSON()).toStrictEqual(expectedFields)
  })

  it('maps to dynamics', async () => {
    const rcrActivity = new RCRActivity()
    rcrActivity.status = RCR_ACTIVITY_STATUS.SUBMITTED
    rcrActivity.season = 2025
    rcrActivity.startDate = '2020-03-31T22:59:00Z'
    rcrActivity.submittedDate = '2020-03-31T22:59:00Z'

    const contact = new Contact()
    rcrActivity.bindToEntity(RCRActivity.definition.relationships.licensee, contact)

    const expectedFields = {
      actualend: '2020-03-31T22:59:00Z',
      actualstart: '2020-03-31T22:59:00Z',
      defra_activitystatus: RCR_ACTIVITY_STATUS.SUBMITTED,
      defra_season: 2025,
      'regardingobjectid_contact_defra_rcractivity@odata.bind': `$${contact.uniqueContentId}`
    }

    expect(rcrActivity.toRequestBody()).toStrictEqual(expectedFields)
  })
})
