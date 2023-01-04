import { getData } from '../route'

const getMockPermission = ({ isLicenceForYou }) => ({
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
  it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
    const samplePermission = getMockPermission({ isLicenceForYou: true })
    const result = await getData(getMockRequest(samplePermission))
    expect(result.isLicenceForYou).toBeTruthy()
  })

  it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
    const samplePermission = getMockPermission({ isLicenceForYou: false })
    const result = await getData(getMockRequest(samplePermission))
    expect(result.isLicenceForYou).toBeFalsy()
  })
})
