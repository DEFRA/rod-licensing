import { RCRActivity } from '../../entities/rcr-activity.entity.js'
import { PredefinedQuery } from '../predefined-query.js'
import { rcrActivityForContact } from '../rcr-activity.queries.js'

describe('rcrActivityForContact', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return a predefined query', () => {
    const result = rcrActivityForContact('CONTACT123', 2024)
    expect(result).toBeInstanceOf(PredefinedQuery)
  })

  it('root should return RCRActivity', () => {
    const result = rcrActivityForContact('CONTACT123', 2024)
    expect(result._root).toEqual(RCRActivity)
  })

  it('should build correct filter', () => {
    const result = rcrActivityForContact('CONTACT123', 2024)

    expect(result._retrieveRequest.filter).toEqual(
      "regardingobjectid_contact_defra_rcractivity/contactid eq 'CONTACT123' and defra_season eq 2024 and statecode eq 0"
    )
  })

  it('should set expand to empty array', () => {
    const result = rcrActivityForContact('CONTACT123', 2024)

    expect(result._retrieveRequest.expand).toEqual([])
  })

  it.each([
    ['ABC123', 2023],
    ['XYZ999', 2024],
    ['AAAAAA', 2025]
  ])('should return correct retrieve request when contactId is %s and season is %s', (contactId, season) => {
    const result = rcrActivityForContact(contactId, season)

    expect(result._retrieveRequest).toEqual({
      collection: 'defra_rcractivities',
      filter: `regardingobjectid_contact_defra_rcractivity/contactid eq '${contactId}' and defra_season eq ${season} and statecode eq 0`,
      expand: [],
      select: ['activityid', 'defra_activitystatus', 'defra_season', 'actualstart', 'modifiedon', 'actualend']
    })
  })
})
