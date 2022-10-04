import { checkDuplicates } from '../multibuy-duplicate-handler.js'

describe('The multiple check for duplicates handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return true if a duplicate', async () => {
    const licences = [
      {
        licenceHolder: 'duplicate name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      },
      {
        licenceHolder: 'duplicate name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2025-01-01',
        price: '5'
      },
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2024-01-01',
        price: '5'
      }
    ]

    const result = await checkDuplicates(licences)
    expect(result).toBeTruthy()
  })

  it('should return false if no duplicate licence holders', async () => {
    const licences = [
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      },
      {
        licenceHolder: 'different name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      },
      {
        licenceHolder: 'another name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      }
    ]

    const result = await checkDuplicates(licences)
    expect(result).toBeFalsy()
  })

  it('should return false if no duplicate type', async () => {
    const licences = [
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      },
      {
        licenceHolder: 'name',
        type: 'Trout and coarse, 2 rod',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      },
      {
        licenceHolder: 'name',
        type: 'Trout and coarse, 3 rod',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      }
    ]

    const result = await checkDuplicates(licences)
    expect(result).toBeFalsy()
  })

  it('should return false if no duplicate length', async () => {
    const licences = [
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      },
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '1D',
        start: '2025-01-01',
        price: '30'
      },
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '3D',
        start: '2025-01-01',
        price: '30'
      }
    ]

    const result = await checkDuplicates(licences)
    expect(result).toBeFalsy()
  })

  it('should return false if no duplicate start', async () => {
    const licences = [
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2024-01-01',
        price: '30'
      },
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2023-01-01',
        price: '30'
      },
      {
        licenceHolder: 'name',
        type: 'Salmon and sea trout',
        length: '12M',
        start: '2025-01-01',
        price: '30'
      }
    ]

    const result = await checkDuplicates(licences)
    expect(result).toBeFalsy()
  })
})
