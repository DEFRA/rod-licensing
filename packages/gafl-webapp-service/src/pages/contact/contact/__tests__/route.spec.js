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
  const getMockRequest = ({ isLicenceForYou, licenceType, licensee }) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => ({
            licensee,
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
      const licensee = { birthDate: 'birthDate' }
      const result = await getData(getMockRequest({ isLicenceForYou, licensee }))
      expect(result.title).toBe(expected)
    })

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
      [true, 'Post hint you'],
      [false, 'Post hint other']
    ])('postHint wording depending on whether isLicenceForYou is %s', async (isLicenceForYou, expected) => {
      const licensee = { birthDate: 'birthDate' }
      const result = await getData(getMockRequest({ isLicenceForYou, licensee }))
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
        const licensee = { birthDate: 'birthDate' }
        const result = await getData(getMockRequest({ isLicenceForYou, licenceType, licensee }))
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
      [true, true],
      [false, false]
    ])('isJunior matches return method of hasJunior', async (physical, expected) => {
      const licensee = { birthDate: 'birthDate' }
      hasJunior.mockReturnValueOnce(physical)
      const result = await getData(getMockRequest({ licensee }))
      expect(result.isJunior).toBe(expected)
    })
  })

  describe('default', () => {
    it('should call the pageRoute with mock-contact-page, /mock/contact/page/uri, validator, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('mock-contact-page', '/mock/contact/page/uri', validator, nextPage, getData)
    })
  })
})
