import { CONCESSION, CONCESSION_PROOF, HOW_CONTACTED } from '../../constants.js'
import moment from 'moment-timezone'
import * as ages from '../ages.js'

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

const LICENCE_START_DATE = '2020-06-06'

const getLicensee = ({ age, referenceDate = LICENCE_START_DATE } = {}) => ({
  firstName: 'Johnny',
  lastName: 'Test',
  preferredMethodOfConfirmation: HOW_CONTACTED.letter,
  birthDate: moment(referenceDate).subtract(age, 'years').format('YYYY-MM-DD')
})

describe('The concession helper', () => {
  describe('age determination', () => {
    describe('isMinor', () => {
      it.each(Array.from({ length: ages.MINOR_MAX_AGE }, (_v, index) => index + 1))('age of %d is a minor', age => {
        expect(ages.isMinor(age)).toBeTruthy()
      })

      it(`${ages.MINOR_MAX_AGE + 1} is not a minor`, () => {
        expect(ages.isMinor(ages.MINOR_MAX_AGE + 1)).toBeFalsy()
      })
    })

    describe('isJunior', () => {
      it.each(Array.from({ length: ages.JUNIOR_MAX_AGE - ages.MINOR_MAX_AGE }, (_v, index) => ages.MINOR_MAX_AGE + index + 1))(
        'Age of %d is a Junior',
        age => {
          expect(ages.isJunior(age)).toBeTruthy()
        }
      )
      it.each([ages.MINOR_MAX_AGE, ages.JUNIOR_MAX_AGE + 1])('Age of %d is not a junior', age => {
        expect(ages.isJunior(age)).toBeFalsy()
      })
    })

    describe('isSenior', () => {
      it.each(Array.from({ length: 10 }, (_v, index) => ages.SENIOR_MIN_AGE + index))('age of %d is a senior', age => {
        expect(ages.isSenior(age)).toBeTruthy()
      })

      it(`age of ${ages.SENIOR_MIN_AGE - 1} is not a senior`, () => {
        expect(ages.isSenior(ages.SENIOR_MIN_AGE - 1)).toBeFalsy()
      })
    })
  })

  describe('addJunior', () => {
    it('concessions contains junior', () => {
      ages.addJunior(permission)
      expect(permission.concessions).toContainEqual(junior)
    })

    it('concessions contains only 1 junior', () => {
      ages.addJunior(permission)
      expect(permission.concessions.length).toBe(1)
    })
  })

  describe('addSenior', () => {
    it('concessions contains senior', () => {
      ages.addSenior(permission)
      expect(permission.concessions).toContainEqual(senior)
    })

    it('concessions contains only 1 senior', () => {
      ages.addSenior(permission)
      expect(permission.concessions.length).toBe(1)
    })
  })

  describe('addDisabled blue badge', () => {
    it('concessions contains disabled blue badge', () => {
      ages.addDisabled(permission, CONCESSION_PROOF.blueBadge, '123')
      expect(permission.concessions).toContainEqual(disabledbb)
    })

    it('concessions contains only 2 disabled blue badge', () => {
      ages.addDisabled(permission, CONCESSION_PROOF.blueBadge, '123')
      expect(permission.concessions.length).toBe(2)
    })
  })

  describe('addDisabled NI', () => {
    it('concessions contains disabled NI', () => {
      ages.addDisabled(permission, CONCESSION_PROOF.NI, '456')
      expect(permission.concessions).toContainEqual(disabledNi)
    })

    it('concessions contains only 2 disabled NI', () => {
      ages.addDisabled(permission, CONCESSION_PROOF.NI, '456')
      expect(permission.concessions.length).toBe(2)
    })
  })

  it('add junior to disabled concessions contains junior', () => {
    ages.addJunior(permission)
    expect(permission.concessions).toContainEqual(junior)
  })

  it('add junior to disabled concessions contains only 2', () => {
    ages.addJunior(permission)
    expect(permission.concessions.length).toBe(2)
  })

  it('add NI to junior concessions contains junior', () => {
    ages.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions).toContainEqual(disabledNi)
  })

  it('add NI to junior concessions contains only 2 disabled NI', () => {
    ages.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions.length).toBe(2)
  })

  it('add senior to NI contains senior', () => {
    ages.addSenior(permission)
    expect(permission.concessions.length).toBe(2)
  })

  it('add senior to NI has 2 concessions', () => {
    ages.addSenior(permission)
    expect(permission.concessions.length).toBe(2)
  })

  it('add junior to replace senior contains junior', () => {
    ages.removeDisabled(permission)
    ages.addJunior(permission)
    expect(permission.concessions.length).toBe(1)
  })

  it('add junior to replace senior contains only 1 concession', () => {
    ages.removeDisabled(permission)
    ages.addJunior(permission)
    expect(permission.concessions.length).toBe(1)
  })

  it('add NI to replace senior contains ni', () => {
    ages.clear(permission)
    ages.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions).toContainEqual(disabledNi)
  })

  it('add NI to replace senior contains only 1 concession', () => {
    ages.clear(permission)
    ages.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions.length).toBe(1)
  })

  it('add senior to replace NI contains senior', () => {
    ages.clear(permission)
    ages.addSenior(permission)
    expect(permission.concessions).toContainEqual(senior)
  })

  it('add senior to replace NI has only 1 concession', () => {
    ages.clear(permission)
    ages.addSenior(permission)
    expect(permission.concessions.length).toBe(1)
  })

  describe('getAgeConcession', () => {
    ;[junior, senior].forEach(concession => {
      it(`returns the ${concession.type} concession if present`, () => {
        const permission = { concessions: [concession] }
        expect(ages.getAgeConcession(permission)).toBe(concession)
      })
    })

    it('returns undefined if only disabled concession present', () => {
      const permission = { concessions: [disabledNi] }
      expect(ages.getAgeConcession(permission)).toBe(undefined)
    })

    it("returns undefined if concessions don't exist", () => {
      const permission = {}
      expect(ages.getAgeConcession(permission)).toBe(undefined)
    })
  })

  describe('ageConcessionHelper', () => {
    beforeEach(jest.clearAllMocks)

    const getSamplePermission = ({
      licenceStartDate = LICENCE_START_DATE,
      licensee = getLicensee(67, licenceStartDate),
      concessions = []
    } = {}) => ({
      licenceStartDate,
      licensee,
      concessions: []
    })

    it('if the licensee is a minor, sets noLicenceRequired flag to true', () => {
      const licensee = getLicensee({ age: 8 })
      const permission = getSamplePermission({ licensee })
      ages.ageConcessionHelper(permission)
      expect(permission).toMatchSnapshot()
    })

    it('if the licensee is a junior, sets license data, junior concession and contact methods', () => {
      const licensee = getLicensee({ age: 14 })
      const permission = getSamplePermission({ licensee })
      ages.ageConcessionHelper(permission)
      expect(permission).toMatchSnapshot()
    })

    it('if the licensee is a senior, adds senior concession', () => {
      const licensee = getLicensee({ age: 67 })
      const permission = getSamplePermission({ licensee })
      ages.ageConcessionHelper(permission)
      expect(permission).toMatchSnapshot()
    })

    ;[junior, senior].forEach(concession => {
      it(`if is normal licence, removes ${concession.type} concession`, () => {
        const licensee = getLicensee({ age: 35 })
        const permission = getSamplePermission({ licensee, concessions: [concession] })
        ages.ageConcessionHelper(permission)
        expect(permission).toMatchSnapshot()
      })
    })
  })
})
