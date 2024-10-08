import * as concessionService from '../concession.service.js'
import { CONCESSION, CONCESSION_PROOF } from '../constants.js'
import { getReferenceDataForEntity, getReferenceDataForEntityAndId } from '../reference-data.service.js'

jest.mock('@defra-fish/connectors-lib')
jest.mock('../reference-data.service.js')

getReferenceDataForEntity.mockImplementation(() => [
  {
    id: 'aaa-111-bbb-222',
    name: CONCESSION.JUNIOR
  },
  {
    id: 'ccc-333-ddd-444',
    name: CONCESSION.SENIOR
  },
  {
    id: 'eee-555-fff-666',
    name: CONCESSION.DISABLED
  }
])

getReferenceDataForEntityAndId.mockImplementation((_e, id) => {
  if (id === 'aaa-111-bbb-222') {
    return {
      id,
      name: CONCESSION.JUNIOR
    }
  }
  if (id === 'ccc-333-ddd-444') {
    return {
      id,
      name: CONCESSION.SENIOR
    }
  }
  if (id === 'eee-555-fff-666') {
    return {
      id,
      name: CONCESSION.DISABLED
    }
  }
  throw Error('Unrecognised concession id')
})

const getMockPermission = () => ({})

const getJuniorConcession = () => ({
  id: 'aaa-111-bbb-222',
  name: CONCESSION.JUNIOR,
  proof: {
    type: CONCESSION_PROOF.none
  }
})

const getSeniorConcession = () => ({
  id: 'ccc-333-ddd-444',
  name: CONCESSION.SENIOR,
  proof: {
    type: CONCESSION_PROOF.none
  }
})

const getDisabledBlueBadgeConcession = () => ({
  id: 'eee-555-fff-666',
  name: CONCESSION.DISABLED,
  proof: {
    type: CONCESSION_PROOF.blueBadge,
    referenceNumber: 'blue-badge-123'
  }
})

const getDisabledNiConcession = () => ({
  id: 'eee-555-fff-666',
  name: CONCESSION.DISABLED,
  proof: {
    type: CONCESSION_PROOF.NI,
    referenceNumber: 'national-insurance-456'
  }
})

describe('preparePermissionDataForRenewal', () => {
  describe('Disabled', () => {
    describe('addDisabled', () => {
      it('add blue badge', async () => {
        const permission = getMockPermission()
        await concessionService.addDisabled(permission, CONCESSION_PROOF.blueBadge, 'bb-111')
        expect(permission.concessions).toContainEqual(
          expect.objectContaining({
            id: 'eee-555-fff-666',
            name: CONCESSION.DISABLED,
            proof: {
              type: CONCESSION_PROOF.blueBadge,
              referenceNumber: 'bb-111'
            }
          })
        )
      })

      it('add NI', async () => {
        const permission = getMockPermission()
        await concessionService.addDisabled(permission, CONCESSION_PROOF.NI, 'national-insurance-456')
        expect(permission.concessions).toContainEqual(expect.objectContaining(getDisabledNiConcession()))
      })

      it('add blue badge to senior licence', async () => {
        const permission = getMockPermission()
        const seniorConcession = getSeniorConcession()
        permission.concessions = [seniorConcession]
        await concessionService.addDisabled(permission, CONCESSION_PROOF.blueBadge, 'blue-badge-123')
        expect(permission.concessions).toEqual(
          expect.arrayContaining([expect.objectContaining(getDisabledBlueBadgeConcession()), expect.objectContaining(seniorConcession)])
        )
      })

      it('add NI to senior licence', async () => {
        const permission = getMockPermission()
        const seniorConcession = getSeniorConcession()
        permission.concessions = [seniorConcession]
        await concessionService.addDisabled(permission, CONCESSION_PROOF.NI, 'national-insurance-456')
        expect(permission.concessions).toEqual(
          expect.arrayContaining([expect.objectContaining(getDisabledNiConcession()), expect.objectContaining(seniorConcession)])
        )
      })
    })

    describe('removeDisabled', () => {
      it.each([
        ['blue badge', []],
        ['blue badge and senior', [getSeniorConcession()]]
      ])('remove disabled concession from array with %s concession(s)', async (_d, additionalConcessions) => {
        const permission = getMockPermission()
        const disabledConcession = getDisabledBlueBadgeConcession()
        permission.concessions = [disabledConcession, ...additionalConcessions]
        await concessionService.removeDisabled(permission)
        expect(permission.concessions).toEqual(expect.not.arrayContaining([expect.objectContaining(disabledConcession)]))
      })

      it.each([
        ['NI', []],
        ['NI and senior', [getSeniorConcession()]]
      ])('remove disabled concession from array with %s concession(s)', async (_d, additionalConcessions) => {
        const permission = getMockPermission()
        const disabledConcession = getDisabledNiConcession()
        permission.concessions = [disabledConcession, ...additionalConcessions]
        await concessionService.removeDisabled(permission)
        expect(permission.concessions).toEqual(expect.not.arrayContaining([expect.objectContaining(disabledConcession)]))
      })

      it.each([
        ['senior', 'blue badge', getSeniorConcession(), getDisabledBlueBadgeConcession()],
        ['junior', 'blue badge', getJuniorConcession(), getDisabledBlueBadgeConcession()],
        ['senior', 'NI', getSeniorConcession(), getDisabledNiConcession()],
        ['junior', 'NI', getJuniorConcession(), getDisabledNiConcession()]
      ])('leaves remaining %s concession when removing a disabled %s concession', async (_cd, _dcd, concession, disabledConcession) => {
        const permission = getMockPermission()
        permission.concessions = [disabledConcession, concession]
        await concessionService.removeDisabled(permission)
        expect(permission.concessions).toEqual(expect.arrayContaining([expect.objectContaining(concession)]))
      })
    })

    describe('hasDisabled', () => {
      it('returns true if have disabled blue badge', async () => {
        const permission = getMockPermission()
        permission.concessions = [getDisabledBlueBadgeConcession()]
        const result = await concessionService.hasDisabled(permission)
        expect(result).toBe(true)
      })

      it('returns true if have disabled NI', async () => {
        const permission = getMockPermission()
        permission.concessions = [getDisabledNiConcession()]
        const result = await concessionService.hasDisabled(permission)
        expect(result).toBe(true)
      })

      it('returns false if do not have disabled', async () => {
        const permission = getMockPermission()
        permission.concessions = []
        const result = await concessionService.hasDisabled(permission)
        expect(result).toBe(false)
      })
    })
  })

  describe('Senior', () => {
    describe('addSenior', () => {
      it('add concession', async () => {
        const permission = getMockPermission()
        await concessionService.addSenior(permission)
        expect(permission.concessions).toContainEqual(getSeniorConcession())
      })

      it("doesn't add second senior concession if one's already present", async () => {
        const seniorConcession = getSeniorConcession()
        const permission = getMockPermission()
        permission.concessions = [seniorConcession]
        await concessionService.addSenior(permission)
        expect(permission.concessions).toEqual([expect.objectContaining(seniorConcession)])
      })

      it('add senior to blue badge', async () => {
        const permission = getMockPermission()
        const disabledConcession = getDisabledNiConcession()
        permission.concessions = [disabledConcession]
        await concessionService.addSenior(permission)
        expect(permission.concessions).toEqual([disabledConcession, getSeniorConcession()])
      })

      it('add senior to NI', async () => {
        const permission = getMockPermission()
        const disabledConcession = getDisabledBlueBadgeConcession()
        permission.concessions = [disabledConcession]
        await concessionService.addSenior(permission)
        expect(permission.concessions).toEqual([disabledConcession, getSeniorConcession()])
      })
    })

    describe('removeSenior', () => {
      it.each([
        ['has only a senior concession', [getSeniorConcession()], []],
        [
          'has senior and disabled concessions',
          [getSeniorConcession(), getDisabledBlueBadgeConcession()],
          [getDisabledBlueBadgeConcession()]
        ]
      ])('removes senior concession if permission %s', async (_desc, concessions, expectedConcessions) => {
        const permission = getMockPermission()
        permission.concessions = concessions
        await concessionService.removeSenior(permission)
        expect(permission.concessions).toEqual(expectedConcessions)
      })

      it.each([
        ['is empty', []],
        ['has junior concession', [getJuniorConcession()]],
        ['has junior and disabled concession', [getJuniorConcession(), getDisabledBlueBadgeConcession()]],
        ['has disabled concession', [getDisabledNiConcession()]]
      ])('leaves concessions unmodified if senior concession not present and concessions %s', async (_desc, concessions) => {
        const permission = getMockPermission()
        permission.concessions = concessions
        await concessionService.removeSenior(permission)
        expect(permission.concessions).toEqual(concessions)
      })
    })

    describe('hasSenior', () => {
      it.each(['senior'])('is true if licensee has senior concession', async () => {
        const permission = getMockPermission()
        permission.concessions = [getSeniorConcession()]
        const isSenior = await concessionService.hasSenior(permission)
        expect(isSenior).toBe(true)
      })

      it.each([
        ['empty array', []],
        ['array with disabled concession', [getDisabledBlueBadgeConcession()]]
      ])("is false if licensee doesn't have senior concession in %s", async (_d, concessions) => {
        const permission = getMockPermission()
        permission.concessions = concessions
        const isSenior = await concessionService.hasSenior(permission)
        expect(isSenior).toBe(false)
      })
    })
  })

  describe('Junior', () => {
    describe('removeJunior', () => {
      it.each([
        ['has only a junior concession', [getJuniorConcession()], []],
        [
          'has junior and disabled concessions',
          [getJuniorConcession(), getDisabledBlueBadgeConcession()],
          [getDisabledBlueBadgeConcession()]
        ]
      ])('removes junior concession if concessions %s', async (_desc, concessions, expectedConcessions) => {
        const permission = getMockPermission()
        permission.concessions = concessions
        await concessionService.removeJunior(permission)
        expect(permission.concessions).toEqual(expectedConcessions)
      })

      it.each([
        ['is empty', []],
        ['has senior concession', [getSeniorConcession()]],
        ['has senior and disabled concession', [getSeniorConcession(), getDisabledBlueBadgeConcession()]],
        ['has disabled concession', [getDisabledNiConcession()]]
      ])('leaves concessions unmodified if junior concession not present and concessions %s', async (_desc, concessions) => {
        const permission = getMockPermission()
        permission.concessions = concessions
        await concessionService.removeJunior(permission)
        expect(permission.concessions).toEqual(concessions)
      })
    })

    describe('hasJunior', () => {
      it('returns true if permission has a junior concession', async () => {
        const permission = getMockPermission()
        permission.concessions = [getJuniorConcession()]
        const result = await concessionService.hasJunior(permission)
        expect(result).toBe(true)
      })

      it.each([
        ['empty array', []],
        ['array with disabled concession', [getDisabledBlueBadgeConcession()]]
      ])("is false if licensee doesn't have junior concession in %s", async (_d, concessions) => {
        const permission = getMockPermission()
        permission.concessions = concessions
        const isJunior = await concessionService.hasJunior(permission)
        expect(isJunior).toBe(false)
      })
    })
  })
})
