import * as concessionService from '../concessions.service.js'
import { CONCESSION, CONCESSION_PROOF } from '../constants.js'
import { salesApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib')

const mockConcessions = [
  {
    id: '3230c68f-ef65-e611-80dc-c4346bad4004',
    name: 'Junior'
  },
  {
    id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
    name: 'Senior'
  },
  {
    id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
    name: 'Disabled'
  }
]

salesApi.concessions.getAll.mockResolvedValue(mockConcessions)

const permission = {}

const junior = {
  type: CONCESSION.JUNIOR,
  proof: {
    type: CONCESSION_PROOF.none
  }
}

const senior = {
  type: CONCESSION.SENIOR,
  proof: {
    type: CONCESSION_PROOF.none
  }
}

const disabledBlueBadge = {
  type: CONCESSION.DISABLED,
  proof: {
    type: CONCESSION_PROOF.blueBadge,
    referenceNumber: '123'
  }
}

const disabledNi = {
  type: CONCESSION.DISABLED,
  proof: {
    type: CONCESSION_PROOF.NI,
    referenceNumber: '456'
  }
}

const concessionProofDisabledBlueBadge = {
  id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
  ...disabledBlueBadge
}

const concessionProofDisabledNi = {
  id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
  ...disabledNi
}

describe('Concession service', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('addConcessionProofs', () => {
    it('should set disabled concession to permission', async () => {
      permission.concessions = [concessionProofDisabledBlueBadge, concessionProofDisabledNi]
      await concessionService.addConcessionProofs(permission)
      expect(permission.concessions[0].type).toEqual('Disabled')
    })

    it('should not set disabled concession to permission', async () => {
      permission.concessions = []
      await concessionService.addConcessionProofs(permission)
      expect(permission.concessions[0]).toBeUndefined()
    })

    it('should not set disabled concession to permission if concession isnt disabled', async () => {
      permission.concessions = [senior]
      await concessionService.addConcessionProofs(permission)
      expect(permission.concessions[0].type).not.toEqual('Disabled')
    })
  })

  describe('Disabled', () => {
    describe('addDisabled', () => {
      it('add blue badge', () => {
        permission.concesssions = undefined
        concessionService.addDisabled(permission, CONCESSION_PROOF.blueBadge, '123')
        expect(permission.concessions).toContainEqual(disabledBlueBadge)
      })

      it('add NI', () => {
        concessionService.addDisabled(permission, CONCESSION_PROOF.NI, '456')
        expect(permission.concessions).toContainEqual(disabledNi)
      })

      it('add blue badge to senior licence', () => {
        permission.concessions = [senior]
        concessionService.addDisabled(permission, CONCESSION_PROOF.blueBadge, '123')
        expect(permission.concessions).toContainEqual(disabledBlueBadge)
      })

      it('add NI to senior licence', () => {
        permission.concessions = [senior]
        concessionService.addDisabled(permission, CONCESSION_PROOF.NI, '456')
        expect(permission.concessions).toContainEqual(disabledNi)
      })
    })

    describe('removeDisabled', () => {
      it('remove blue badge', () => {
        permission.concessions = [disabledBlueBadge]
        concessionService.removeDisabled(permission)
        expect(permission.concessions.length).toBe(0)
      })

      it('remove NI', () => {
        permission.concessions = [disabledNi]
        concessionService.removeDisabled(permission)
        expect(permission.concessions.length).toBe(0)
      })
    })

    describe('hasDisabled', () => {
      it('returns true if have disabled blue badge', () => {
        permission.concessions = [disabledBlueBadge]
        const result = concessionService.hasDisabled(permission)
        expect(result).toBe(true)
      })

      it('returns true if have disabled NI', () => {
        permission.concessions = [disabledNi]
        const result = concessionService.hasDisabled(permission)
        expect(result).toBe(true)
      })

      it('returns false if do not have disabled', () => {
        permission.concessions = []
        const result = concessionService.hasDisabled(permission)
        expect(result).toBe(false)
      })
    })
  })

  describe('Senior', () => {
    describe('addSenior', () => {
      it('add senior', () => {
        concessionService.addSenior(permission)
        expect(permission.concessions).toContainEqual(senior)
      })

      it('add senior when already senior', () => {
        concessionService.addSenior(permission)
        expect(permission.concessions).toContainEqual(senior)
      })

      it('add senior to blue badge', () => {
        permission.concessions = [disabledNi]
        concessionService.addSenior(permission)
        expect(permission.concessions.length).toBe(2)
      })

      it('add senior to NI', () => {
        permission.concessions = [disabledBlueBadge]
        concessionService.addSenior(permission)
        expect(permission.concessions.length).toBe(2)
      })
    })

    describe('removeSenior', () => {
      it('remove senior', () => {
        permission.concessions = [senior]
        concessionService.removeSenior(permission)
        expect(permission.concessions.length).toBe(0)
      })
    })

    describe('hasSenior', () => {
      it('returns true if are senior', () => {
        permission.concessions = [senior]
        const result = concessionService.hasSenior(permission)
        expect(result).toBe(true)
      })

      it('returns false if are not senior', () => {
        permission.concessions = []
        const result = concessionService.hasSenior(permission)
        expect(result).toBe(false)
      })
    })
  })

  describe('Junior', () => {
    describe('removeJunior', () => {
      it('remove senior', () => {
        permission.concessions = [junior]
        concessionService.removeJunior(permission)
        expect(permission.concessions.length).toBe(0)
      })
    })

    describe('hasJunior', () => {
      it('returns true if are junior', () => {
        permission.concessions = [junior]
        const result = concessionService.hasJunior(permission)
        expect(result).toBe(true)
      })

      it('returns false if are not junior', () => {
        permission.concessions = []
        const result = concessionService.hasJunior(permission)
        expect(result).toBe(false)
      })
    })
  })
})
