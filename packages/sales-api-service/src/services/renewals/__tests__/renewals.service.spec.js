import { prepareContactMethodData } from '../renewals.service.js'

describe('prepareContactMethodData', () => {
  it('should copy the relevant data', async () => {
    const existingPermission = {
      licensee: {
        preferredMethodOfNewsletter: {
          label: 'Email'
        },
        preferredMethodOfConfirmation: {
          label: 'Text'
        },
        preferredMethodOfReminder: {
          label: 'Letter'
        }
      }
    }
    const expectedData = {
      preferredMethodOfNewsletter: 'Email',
      preferredMethodOfConfirmation: 'Text',
      preferredMethodOfReminder: 'Letter'
    }
    expect(prepareContactMethodData(existingPermission)).toEqual(expectedData)
  })
})
