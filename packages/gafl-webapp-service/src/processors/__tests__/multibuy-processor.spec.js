import { hasDuplicates } from '../multibuy-processor.js'

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
  // different licenceHolder
  const getLicenceTwo = () => ({
    licenceHolder: 'Angler 2',
    type: 'Salmon and sea trout',
    length: '12M',
    start: '2023-01-01',
    price: 70
  })
  // different type
  const getLicenceThree = () => ({
    licenceHolder: 'Angler 1',
    type: 'Coarse 2 rod',
    length: '12M',
    start: '2023-01-01',
    price: 70
  })
  // different length
  const getLicenceFour = () => ({
    licenceHolder: 'Angler 1',
    type: 'Salmon and sea trout',
    length: '3M',
    start: '2023-01-01',
    price: 70
  })
  // different start
  const getLicenceFive = () => ({
    licenceHolder: 'Angler 1',
    type: 'Salmon and sea trout',
    length: '3M',
    start: '2023-02-01',
    price: 70
  })

  it('identifies when array has duplicate licences (same licenceHolder, type, length and start)', async () => {
    const licenses = [getLicenceOne(), getLicenceOne(), getLicenceTwo()]
    const result = await hasDuplicates(licenses)
    expect(result).toBeTruthy()
  })

  it.each([[getLicenceTwo()], [getLicenceThree()], [getLicenceFour()], [getLicenceFive()]])(
    'identifies when array has no duplicate licences',
    async licence => {
      const licenses = [getLicenceOne(), licence]
      const result = await hasDuplicates(licenses)
      expect(result).toBeFalsy()
    }
  )
})
