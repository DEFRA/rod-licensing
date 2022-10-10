import { hasDuplicates } from '../multibuy-duplicate-handler.js'

describe('The multiple check for duplicates handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getLicenceOne = () => ({
    licenceHolder: 'Angler 1',
    type: 'Salmon and sea trout',
    length: '12M',
    start: '2023-01-01',
    price: 70
  })
  const getLicenceTwo = () => ({
    licenceHolder: 'Angler 2',
    type: 'Coarse 3 rod',
    length: '12M',
    start: '2023-01-21',
    price: 50
  })
  const getLicenceThree = () => ({
    licenceHolder: 'Angler 3',
    type: 'Coarse 2 rod',
    length: '12M',
    start: '2023-02-12',
    price: 50
  })
  it('identifies when array has duplicate licences (same licenceHolder, type, length and start)', async () => {
    const licenses = [getLicenceOne(), getLicenceOne(), getLicenceTwo()]
    const result = await hasDuplicates(licenses)
    expect(result).toBeTruthy()
  })

  it('identifies when array has no duplicate licences', async () => {
    const licenses = [getLicenceOne(), getLicenceTwo(), getLicenceThree()]
    const result = await hasDuplicates(licenses)
    expect(result).toBeFalsy()
  })
})
