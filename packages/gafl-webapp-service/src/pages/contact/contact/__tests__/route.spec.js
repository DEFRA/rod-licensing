import { getData, validator } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'
import { hasJunior } from '../../../../processors/concession-helper.js'

jest.mock('../../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../uri.js', () => ({
  ...jest.requireActual('../../../../uri.js'),
  CONTACT: {
    page: 'mock-contact-page',
    uri: '/mock/contact/page/uri'
  }
}))
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/concession-helper.js')

describe('name > route', () => {
  const getMockRequest = ({ isLicenceForYou, licenceType, email, mobilePhone }) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => ({
            licensee: {
              birthDate: 'birthDate',
              email,
              mobilePhone
            },
            licenceLength: 'licenceLength',
            licenceStartDate: 'licenceStartDate',
            isLicenceForYou,
            licenceType
          })
        }
      }
    }),
    i18n: {
      getCatalog: () => getMessages()
    }
  })

  const getMessages = () => ({
    important_info_contact_title_you: 'You title',
    important_info_contact_title_other: 'Other title',
    important_info_contact_item_email: 'Email',
    important_info_contact_item_email_value: 'Email ',
    important_info_contact_item_txt_value: 'Text to ',
    important_info_contact_item_txt: 'Text',
    important_info_contact_post_hint_you: 'Post hint you',
    important_info_contact_post_hint_other: 'Post hint other',
    important_info_contact_post_salmon_you: 'Salmon you',
    important_info_contact_post_not_salmon_you: 'Not salmon you',
    important_info_contact_post_salmon_other: 'Salmon other',
    important_info_contact_post_not_salmon_other: 'Not salmon other'
  })

  describe('getData', () => {
    it.each([
      [true, 'You title'],
      [false, 'Other title']
    ])('title return method is %s if isLicenceForYou is same', async (isLicenceForYou, expected) => {
      const result = await getData(getMockRequest({ isLicenceForYou }))
      expect(result.title).toBe(expected)
    })

    it.each([
      ['test@email.com', 'Email test@email.com'],
      [null, 'Email']
    ])('emailText has correct value depending on if permission has an email', async (email, expected) => {
      const result = await getData(getMockRequest({ email }))
      expect(result.emailText).toBe(expected)
    })

    it.each([
      ['07123456789', 'Text to 07123456789'],
      [null, 'Text']
    ])('mobileText has correct value depending on if permission has a phone number', async (mobilePhone, expected) => {
      const result = await getData(getMockRequest({ mobilePhone }))
      expect(result.mobileText).toBe(expected)
    })

    it.each([
      [true, 'Post hint you'],
      [false, 'Post hint other']
    ])('postHint wording depending on whether isLicenceForYou is %s', async (isLicenceForYou, expected) => {
      const result = await getData(getMockRequest({ isLicenceForYou }))
      expect(result.postHint).toBe(expected)
    })

    it.each([
      [true, 'Salmon and sea trout', 'Salmon you'],
      [true, 'Trout and coarse', 'Not salmon you'],
      [false, 'Salmon and sea trout', 'Salmon other'],
      [false, 'Trout and coarse', 'Not salmon other']
    ])(
      'content has correct value depending on isLicenceForYou is %s and licenceType is %s',
      async (isLicenceForYou, licenceType, expected) => {
        const result = await getData(getMockRequest({ isLicenceForYou, licenceType }))
        expect(result.content).toBe(expected)
      }
    )

    it.each([
      [true, true],
      [false, false]
    ])('result.isPhysical matches return method of isPhysical', async (physical, expected) => {
      isPhysical.mockReturnValueOnce(physical)
      const result = await getData(getMockRequest({}))
      expect(result.isPhysical).toBe(expected)
    })

    it.each([
      [true, true],
      [false, false]
    ])('isJunior matches return method of hasJunior', async (physical, expected) => {
      hasJunior.mockReturnValueOnce(physical)
      const result = await getData(getMockRequest({}))
      expect(result.isJunior).toBe(expected)
    })

    it('howContacted returns the value of HOW_CONTACTED', async () => {
      const expectedValue = { email: 'Email', text: 'Text', letter: 'Letter', none: 'Prefer not to be contacted' }
      const result = await getData(getMockRequest({}))
      expect(result.howContacted).toEqual(expectedValue)
    })
  })

  describe('default', () => {
    it('should call the pageRoute with mock-contact-page, /mock/contact/page/uri, validator, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('mock-contact-page', '/mock/contact/page/uri', validator, nextPage, getData)
    })
  })
})
