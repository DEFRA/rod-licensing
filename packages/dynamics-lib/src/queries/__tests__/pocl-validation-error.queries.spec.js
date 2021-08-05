import { findPoclValidationErrors } from '../pocl-validation-error.queries.js'

describe('POCL validation error Queries', () => {
  describe('findPoclValidationErrors', () => {
    it('applies default filter if no status is provided', () => {
      const query = findPoclValidationErrors()
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_poclvalidationerrors',
        filter: 'statecode eq 0',
        select: expect.any(Array)
      })
    })
  })
  it('filters by status and default filter if status provided', () => {
    const status = { id: 'test-status-id', label: 'Ready for Processing' }
    const query = findPoclValidationErrors(status)
    expect(query.toRetrieveRequest()).toEqual({
      collection: 'defra_poclvalidationerrors',
      filter: 'defra_status eq test-status-id and statecode eq 0',
      select: expect.any(Array)
    })
  })
})
