import resultFunction from '../result-function.js'
import { CommonResults } from '../../../../constants.js'

const createRequest = addLicence => ({
  cache: () => ({
    helpers: {
      page: {
        getCurrentPermission: async () => ({
          payload: {
            'add-licence': addLicence
          }
        })
      }
    }
  })
})

describe('multibuy/add-licence/result-function', () => {
  it("returns yes if payload['add-licence'] is yes", async () => {
    const request = createRequest(CommonResults.YES)
    const result = await resultFunction(request)
    expect(result).toBe(CommonResults.YES)
  })

  it("returns no if payload['add-licence'] is no", async () => {
    const request = createRequest(CommonResults.NO)
    const result = await resultFunction(request)
    expect(result).toBe(CommonResults.NO)
  })
})
