import * as f from '../concession-helper'
import { CONCESSION, CONCESSION_PROOF } from '../mapping-constants'

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
    expect(permission.concessions.length).toBe(1)
  })
  it('add NI', () => {
    f.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions).toContainEqual(disabledNi)
    expect(permission.concessions.length).toBe(1)
  })
  it('add junior to replace disabled', () => {
    f.addJunior(permission)
    expect(permission.concessions).toContainEqual(junior)
    expect(permission.concessions.length).toBe(1)
  })
  it('add NI to replace junior', () => {
    f.addDisabled(permission, CONCESSION_PROOF.NI, '456')
    expect(permission.concessions).toContainEqual(disabledNi)
    expect(permission.concessions.length).toBe(1)
  })
  it('add senior to replace NI', () => {
    f.addSenior(permission)
    expect(permission.concessions).toContainEqual(senior)
    expect(permission.concessions.length).toBe(1)
  })
  it('add junior to replace senior', () => {
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
})
