import * as f from '../concession-helper'
import { CONCESSION, CONCESSION_PROOF, HOW_CONTACTED } from '../mapping-constants'
import moment from 'moment'
import { isSenior } from '@defra-fish/business-rules-lib'

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

const disabledbb = {
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

const getLicensee = birthDate => ({
  firstName: 'Johnny',
  lastName: 'Test',
  preferredMethodOfConfirmation: HOW_CONTACTED.letter,
  birthDate
})

jest.mock('@defra-fish/business-rules-lib', () => {
  const businessRules = jest.requireActual('@defra-fish/business-rules-lib')
  return {
    ...businessRules,
    isSenior: jest.fn(businessRules.isSenior)
  }
})

describe('The concession helper', () => {
  it('add junior', () => {
    f.addJunior(permission)
    expect(permission.concessions).toContainEqual(junior)
    expect(permission.concessions.length).toBe(1)
  })
  it('add senior', () => {
    f.addSenior(permission)
    expect(permission.concessions).toContainEqual(senior)
    expect(permission.concessions.length).toBe(1)
  })
  it('add blue badge', () => {
    f.addDisabled(permission, CONCESSION_PROOF.blueBadge, '123')
    expect(permission.concessions).toContainEqual(disabledbb)
    expect(permission.concessions.length).toBe(2)
  })
  it('add NI', () => {
    f.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions).toContainEqual(disabledNi)
    expect(permission.concessions.length).toBe(2)
  })
  it('add junior to disabled', () => {
    f.addJunior(permission)
    expect(permission.concessions).toContainEqual(junior)
    expect(permission.concessions.length).toBe(2)
  })
  it('add NI to junior', () => {
    f.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions).toContainEqual(disabledNi)
    expect(permission.concessions.length).toBe(2)
  })
  it('add senior to NI', () => {
    f.addSenior(permission)
    expect(permission.concessions).toContainEqual(senior)
    expect(permission.concessions.length).toBe(2)
  })
  it('add junior to replace senior', () => {
    f.removeDisabled(permission)
    f.addJunior(permission)
    expect(permission.concessions).toContainEqual(junior)
    expect(permission.concessions.length).toBe(1)
  })
  it('add NI to replace senior', () => {
    f.clear(permission)
    f.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions).toContainEqual(disabledNi)
    expect(permission.concessions.length).toBe(1)
  })
  it('add senior to replace NI', () => {
    f.clear(permission)
    f.addSenior(permission)
    expect(permission.concessions).toContainEqual(senior)
    expect(permission.concessions.length).toBe(1)
  })

  describe('getAgeConcession', () => {
    ;[junior, senior].forEach(concession => {
      it(`returns the ${concession.type} concession if present`, () => {
        const permission = { concessions: [concession] }
        expect(f.getAgeConcession(permission)).toBe(concession)
      })
    })

    it('returns undefined if only disabled concession present', () => {
      const permission = { concessions: [disabledNi] }
      expect(f.getAgeConcession(permission)).toBe(undefined)
    })

    it("returns undefined if concessions don't exist", () => {
      const permission = {}
      expect(f.getAgeConcession(permission)).toBe(undefined)
    })
  })

  describe('ageConcessionHelper', () => {
    beforeEach(jest.clearAllMocks)
    const licenceStartDate = '2020-06-06'

    it('if the licensee is a minor, sets noLicenceRequired flag to true', () => {
      const licensee = getLicensee(moment(licenceStartDate).subtract(8, 'years').format('YYYY-MM-DD'))
      const permission = { licenceStartDate, licensee, concessions: [] }
      f.ageConcessionHelper(permission)
      expect(permission).toMatchSnapshot()
    })

    it('if the licensee is a junior, sets license data, junior concession and contact methods', () => {
      const licensee = getLicensee(moment(licenceStartDate).subtract(14, 'years').format('YYYY-MM-DD'))
      const permission = { licenceStartDate, licensee, concessions: [] }
      f.ageConcessionHelper(permission)
      expect(permission).toMatchSnapshot()
    })

    it('if the licensee is a senior, adds senior concession', () => {
      const licensee = getLicensee(moment(licenceStartDate).subtract(67, 'years').format('YYYY-MM-DD'))
      const permission = { licenceStartDate, licensee, concessions: [] }
      f.ageConcessionHelper(permission)
      expect(permission).toMatchSnapshot()
    })

    it('passes permission start date to isSenior function', () => {
      const licensee = getLicensee(moment(licenceStartDate).subtract(65, 'years').format('YYYY-MM-DD'))
      const permission = { licenceStartDate, licensee, concessions: [] }
      f.ageConcessionHelper(permission)
      expect(isSenior).toHaveBeenCalledWith(expect.any(Number), licenceStartDate)
    })
    ;[junior, senior].forEach(concession => {
      it(`if is normal licence, removes ${concession.type} concession`, () => {
        const licensee = getLicensee(moment(licenceStartDate).subtract(35, 'years').format('YYYY-MM-DD'))
        const permission = { licenceStartDate, licensee, concessions: [concession] }
        f.ageConcessionHelper(permission)
        expect(permission).toMatchSnapshot()
      })
    })
  })
})
