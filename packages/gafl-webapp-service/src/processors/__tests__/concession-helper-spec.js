import * as f from '../concession-helper'
import { CONCESSION, CONCESSION_PROOF } from '../mapping-constants'

const licensee = {}

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

describe('The concession helper', () => {
  it('add junior', () => {
    f.addJunior(licensee)
    expect(licensee.concessions).toContainEqual(junior)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add senior', () => {
    f.addSenior(licensee)
    expect(licensee.concessions).toContainEqual(senior)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add blue badge', () => {
    f.addDisabled(licensee, CONCESSION_PROOF.blueBadge, '123')
    expect(licensee.concessions).toContainEqual(disabledbb)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add NI', () => {
    f.addDisabled(licensee, CONCESSION_PROOF.NI, '456')
    expect(licensee.concessions).toContainEqual(disabledNi)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add junior to replace disabled', () => {
    f.addJunior(licensee)
    expect(licensee.concessions).toContainEqual(junior)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add NI to replace junior', () => {
    f.addDisabled(licensee, CONCESSION_PROOF.NI, '456')
    expect(licensee.concessions).toContainEqual(disabledNi)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add senior to replace NI', () => {
    f.addSenior(licensee)
    expect(licensee.concessions).toContainEqual(senior)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add junior to replace senior', () => {
    f.addJunior(licensee)
    expect(licensee.concessions).toContainEqual(junior)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add NI to replace senior', () => {
    f.clear(licensee)
    f.addDisabled(licensee, CONCESSION_PROOF.NI, '456')
    expect(licensee.concessions).toContainEqual(disabledNi)
    expect(licensee.concessions.length).toBe(1)
  })
  it('add senior to replace NI', () => {
    f.clear(licensee)
    f.addSenior(licensee)
    expect(licensee.concessions).toContainEqual(senior)
    expect(licensee.concessions.length).toBe(1)
  })
})
