import { validation } from '../index.js'

describe('business-rules-lib', () => {
  it('exposes validators', async () => {
    expect(validation).toMatchObject({
      contact: expect.anything(),
      permission: expect.anything()
    })
  })
})
