import { concessionsByIds } from '../concession-proof.queries'

describe('concession-proof.queries', () => {
  describe('concessionsByIds', () => {
    it('should throw an error if an array is not passed in', () => {
      expect(() => {
        concessionsByIds({})
      }).toThrow(new Error('concessionIds must be an array'))
    })

    it('should throw an error if the array passed in is empty', () => {
      expect(() => {
        concessionsByIds([])
      }).toThrow(new Error('concessionIds must not be empty'))
    })

    it('should build a filter with one id', () => {
      const query = concessionsByIds(['123'])
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_concessionproofs',
        expand: expect.arrayContaining([expect.objectContaining({ property: 'defra_ConcessionNameId' })]),
        filter: 'defra_concessionproofid eq 123 and statecode eq 0',
        select: expect.any(Array)
      })
    })

    it('should build a filter with multiple ids', () => {
      const query = concessionsByIds(['123', '456'])
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_concessionproofs',
        expand: expect.arrayContaining([expect.objectContaining({ property: 'defra_ConcessionNameId' })]),
        filter: 'defra_concessionproofid eq 123 or defra_concessionproofid eq 456 and statecode eq 0',
        select: expect.any(Array)
      })
    })
  })
})
