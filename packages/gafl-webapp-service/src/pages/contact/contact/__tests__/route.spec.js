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
  const getMockRequest = ({ isLicenceForYou, licenceType, licensee, licenceLength = 'length' }) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => ({
            licensee,
            licenceLength,
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
    important_info_contact_post_not_salmon_other: 'Not salmon other',
    important_info_contact_error_choose_short: 'Short term adult error message',
    important_info_contact_error_choose: 'Error message',
    important_info_contact_content_salmon: 'Salmon content',
    important_info_contact_content_not_salmon: 'Not salmon content',
    licence_confirm_method_where_title_you: 'Where send you',
    licence_confirm_method_where_title_other: 'Where send other'
  })

  describe('getData', () => {
    it.each([
      [true, '12M', false, 'You title'],
      [false, '12M', false, 'Other title'],
      [true, '12M', true, 'Where send you'],
      [false, '12M', true, 'Where send other'],
      [true, '8D', false, 'Where send you'],
      [false, '8D', false, 'Where send other'],
      [true, '1D', false, 'Where send you'],
      [false, '1D', false, 'Where send other']
    ])(
      'title return method is %s if isLicenceForYou is same, licenceLength is %s and junior is %s',
      async (isLicenceForYou, licenceLength, junior, expected) => {
        const licensee = { birthDate: 'birthDate' }
        hasJunior.mockReturnValueOnce(junior)
        const result = await getData(getMockRequest({ isLicenceForYou, licensee, licenceLength }))
        expect(result.title).toBe(expected)
      }
    )

    it('mobileText includes value of mobile phone when preferredMethodOfConfirmation is text', async () => {
      const licensee = { birthDate: 'birthDate', preferredMethodOfConfirmation: 'Text' }
      const result = await getData(getMockRequest({ licensee }))
      expect(result.emailText).toBe('Email')
    })

    it('emailText includes value of email when preferredMethodOfConfirmation is email', async () => {
      const licensee = { birthDate: 'birthDate', preferredMethodOfConfirmation: 'Email', email: 'test@email.com' }
      const result = await getData(getMockRequest({ licensee }))
      expect(result.emailText).toBe('Email test@email.com')
    })

    it('mobileText includes value of mobile phone when preferredMethodOfConfirmation is email', async () => {
      const licensee = { birthDate: 'birthDate', preferredMethodOfConfirmation: 'Email' }
      const result = await getData(getMockRequest({ licensee }))
      expect(result.mobileText).toBe('Text')
    })

    it('mobileText includes value of mobile phone when preferredMethodOfConfirmation is text', async () => {
      const licensee = { birthDate: 'birthDate', preferredMethodOfConfirmation: 'Text', mobilePhone: '07123456789' }
      const result = await getData(getMockRequest({ licensee }))
      expect(result.mobileText).toBe('Text to 07123456789')
    })

    it.each([
      [false, 'Text'],
      [true, 'Email']
    ])('emailConfirmation is %s when preferredMethodOfConfirmation is %s', async (expected, method) => {
      const licensee = { birthDate: 'birthDate', preferredMethodOfConfirmation: method, email: 'test@email.com' }
      const result = await getData(getMockRequest({ licensee }))
      expect(result.emailConfirmation).toBe(expected)
    })

    it.each([
      [false, 'Email'],
      [true, 'Text']
    ])('mobileConfirmation is %s when preferredMethodOfConfirmation is %s', async (expected, method) => {
      const licensee = { birthDate: 'birthDate', preferredMethodOfConfirmation: method, email: 'test@email.com' }
      const result = await getData(getMockRequest({ licensee }))
      expect(result.mobileConfirmation).toBe(expected)
    })

    it.each([
      [true, 'Post hint you'],
      [false, 'Post hint other']
    ])('postHint wording depending on whether isLicenceForYou is %s', async (isLicenceForYou, expected) => {
      const licensee = { birthDate: 'birthDate' }
      const result = await getData(getMockRequest({ isLicenceForYou, licensee }))
      expect(result.postHint).toBe(expected)
    })

    it.each([
      [true, 'Salmon and sea trout', '12M', false, 'Salmon you'],
      [true, 'Trout and coarse', '12M', false, 'Not salmon you'],
      [false, 'Salmon and sea trout', '12M', false, 'Salmon other'],
      [false, 'Trout and coarse', '12M', false, 'Not salmon other'],
      [true, 'Salmon and sea trout', '8D', false, 'Salmon content'],
      [true, 'Trout and coarse', '8D', false, 'Not salmon content'],
      [false, 'Salmon and sea trout', '1D', false, 'Salmon content'],
      [false, 'Trout and coarse', '1D', false, 'Not salmon content'],
      [true, 'Salmon and sea trout', '12M', true, 'Salmon content'],
      [true, 'Trout and coarse', '12M', true, 'Not salmon content'],
      [false, 'Salmon and sea trout', '12M', true, 'Salmon content'],
      [false, 'Trout and coarse', '12M', true, 'Not salmon content']
    ])(
      'content has correct value depending on isLicenceForYou is %s, licenceType is %s, licenceLength is %s and junior is %s',
      async (isLicenceForYou, licenceType, licenceLength, junior, expected) => {
        const licensee = { birthDate: 'birthDate' }
        hasJunior.mockReturnValueOnce(junior)
        const result = await getData(getMockRequest({ isLicenceForYou, licenceType, licensee, licenceLength }))
        expect(result.content).toBe(expected)
      }
    )

    it.each([
      [true, true],
      [false, false]
    ])('result.isPhysical matches return method of isPhysical', async (physical, expected) => {
      const licensee = { birthDate: 'birthDate' }
      isPhysical.mockReturnValueOnce(physical)
      const result = await getData(getMockRequest({ licensee }))
      expect(result.isPhysical).toBe(expected)
    })

    it.each([
      ['8D', false, 'Short term adult error message'],
      ['1D', false, 'Short term adult error message'],
      ['12M', false, 'Error message'],
      ['12M', true, 'Short term adult error message']
    ])('error message has correct value depending on licenceLength is %s and junior is %s', async (licenceLength, junior, expected) => {
      const licensee = { birthDate: 'birthDate' }
      hasJunior.mockReturnValueOnce(junior)
      const result = await getData(getMockRequest({ licenceLength, licensee }))
      expect(result.errorMessage).toBe(expected)
    })
  })

  describe('default', () => {
    it('should call the pageRoute with mock-contact-page, /mock/contact/page/uri, validator, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('mock-contact-page', '/mock/contact/page/uri', validator, nextPage, getData)
    })
  })
})
