import { Contact } from '../../index'

describe('contact entity', () => {
  it('maps from dynamics', async () => {
    const contact = Contact.fromResponse({
      '@odata.etag': 'W/"202465000"',
      contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
      firstname: 'Fester',
      lastname: 'Tester',
      birthdate: '1946-01-01',
      emailaddress1: 'fester@tester.com',
      mobilephone: '01234 567890',
      defra_premises: '1',
      defra_street: 'Tester Avenue',
      defra_locality: 'Testville',
      defra_town: 'Tersterton',
      defra_postcode: 'AB12 3CD',
      defra_country: 910400195,
      defra_preferredmethodofcontact: 910400001,
      defra_gdprmarketingpreferenceoptin: false
    })

    const expectedFields = {
      id: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
      firstName: 'Fester',
      lastName: 'Tester',
      birthDate: '1946-01-01',
      email: 'fester@tester.com',
      mobilePhone: '01234 567890',
      premises: '1',
      street: 'Tester Avenue',
      locality: 'Testville',
      town: 'Tersterton',
      postcode: 'AB12 3CD',
      country: 910400195,
      preferredMethodOfContact: 910400001,
      gdprMarketingOptIn: false
    }

    expect(contact).toBeInstanceOf(Contact)
    expect(contact).toMatchObject(expect.objectContaining({ etag: 'W/"202465000"', ...expectedFields }))
    expect(contact.toString()).toMatchObject(expect.objectContaining(expectedFields))
  })

  it('maps to dynamics', async () => {
    const contact = new Contact()
    contact.firstName = 'Fester'
    contact.lastName = 'Tester'
    contact.birthDate = '1946-01-01'
    contact.email = 'fester@tester.com'
    contact.mobilePhone = '01234 567890'
    contact.premises = '1'
    contact.street = 'Tester Avenue'
    contact.locality = 'Testville'
    contact.town = 'Tersterton'
    contact.postcode = 'AB12 3CD'
    contact.country = 910400195
    contact.preferredMethodOfContact = 910400001
    contact.gdprMarketingOptIn = false

    const dynamicsEntity = contact.toRequestBody()
    expect(dynamicsEntity).toMatchObject(
      expect.objectContaining({
        firstname: 'Fester',
        lastname: 'Tester',
        birthdate: '1946-01-01',
        emailaddress1: 'fester@tester.com',
        mobilephone: '01234 567890',
        defra_premises: '1',
        defra_street: 'Tester Avenue',
        defra_locality: 'Testville',
        defra_town: 'Tersterton',
        defra_postcode: 'AB12 3CD',
        defra_country: 910400195,
        defra_preferredmethodofcontact: 910400001,
        defra_gdprmarketingpreferenceoptin: false
      })
    )
  })
})
