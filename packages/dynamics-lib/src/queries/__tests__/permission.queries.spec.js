import { permissionForFullReferenceNumber, permissionForContacts } from '../permission.queries.js'

describe('Permission Queries', () => {
  describe('permissionForFullReferenceNumber', () => {
    it('builds a filter to run a query for a permission with a full reference number', async () => {
      const query = permissionForFullReferenceNumber('ABC123')
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_permissions',
        expand: expect.arrayContaining([
          expect.objectContaining({ property: 'defra_ContactId' }),
          expect.objectContaining({ property: 'defra_PermitId' }),
          expect.objectContaining({ property: 'defra_defra_permission_defra_concessionproof_PermissionId' })
        ]),
        filter: "defra_name eq 'ABC123' and statecode eq 0",
        select: expect.any(Array)
      })
    })
  })

  describe('permissionForContacts', () => {
    it('builds a filter to run a query for a permission with contact id', async () => {
      const query = permissionForContacts('12345')
      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_permissions',
        expand: expect.arrayContaining([
          expect.objectContaining({ property: 'defra_ContactId' }),
          expect.objectContaining({ property: 'defra_PermitId' }),
          expect.objectContaining({ property: 'defra_defra_permission_defra_concessionproof_PermissionId' })
        ]),
        filter: 'defra_ContactId/contactid in (12345) and statecode eq 0',
        select: expect.any(Array)
      })
    })
  })
})
