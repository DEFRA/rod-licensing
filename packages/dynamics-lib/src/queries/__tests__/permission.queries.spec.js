import { permissionForFullReferenceNumber, permissionForContacts } from '../permission.queries.js'

describe('Permission Queries', () => {
  describe('permissionForFullReferenceNumber', () => {
    it.each([['ABC123'], ['DEF456'], ['GHI789']])(
      'builds a filter to run a query for a permission with a full reference number whch is %s',
      async referenceNumber => {
        const query = permissionForFullReferenceNumber(referenceNumber)
        expect(query.toRetrieveRequest()).toEqual({
          collection: 'defra_permissions',
          expand: expect.arrayContaining([
            expect.objectContaining({ property: 'defra_ContactId' }),
            expect.objectContaining({ property: 'defra_PermitId' }),
            expect.objectContaining({ property: 'defra_defra_permission_defra_concessionproof_PermissionId' })
          ]),
          filter: `defra_name eq '${referenceNumber}' and statecode eq 0`,
          select: expect.any(Array)
        })
      }
    )
  })

  describe('permissionForContacts', () => {
    it.each([['AB12 3CD'], ['EF45 6GH'], ['IJ78 9KL']])(
      'builds a filter to run a query for a permission with contact id which is %s',
      async contactId => {
        const query = permissionForContacts([contactId])
        expect(query.toRetrieveRequest()).toEqual({
          collection: 'defra_permissions',
          expand: expect.arrayContaining([
            expect.objectContaining({ property: 'defra_ContactId' }),
            expect.objectContaining({ property: 'defra_PermitId' }),
            expect.objectContaining({ property: 'defra_defra_permission_defra_concessionproof_PermissionId' })
          ]),
          filter: `(defra_ContactId/contactid eq '${contactId}') and statecode eq 0`,
          select: expect.any(Array)
        })
      }
    )
  })
})
