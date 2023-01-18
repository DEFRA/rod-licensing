import { getData } from '../route'

const getMockPermission = ({ isLicenceForYou } = { isLicenceForYou: true }) => ({
  isLicenceForYou,
  licensee: {
    firstName: 'Mynames',
    lastName: 'Jeff'
  }
})

const getMockRequest = (permission = getMockPermission()) => ({
  cache: () => ({
    helpers: {
      transaction: {
        getCurrentPermission: async () => permission
      }
    }
  })
})

describe('route > getData', () => {
  it('should return the correct data for isLicenceForYou, firstName and lastName', async () => {
    const result = await getData(getMockRequest())
    expect(result).toEqual(
      expect.objectContaining({
        isLicenceForYou: true,
        firstName: 'Mynames',
        lastName: 'Jeff'
      })
    )
  })

  it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
    const samplePermission = getMockPermission({ isLicenceForYou: false })
    const result = await getData(getMockRequest(samplePermission))
    expect(result.isLicenceForYou).toBeFalsy()
  })
})
