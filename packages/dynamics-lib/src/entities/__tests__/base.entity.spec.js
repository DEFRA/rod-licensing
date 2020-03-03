import { BaseEntity, EntityDefinition } from '../base.entity'

describe('BaseEntity', () => {
  it('requires subclasses to define a mapping', () => {
    class BadClass extends BaseEntity {}
    const badClassInstance = new BadClass()
    expect(() => badClassInstance.toRequestBody()).toThrow('Definition not defined in subclass')
  })
})

describe('EntityDefinition', () => {
  it('to require a valid entity definition', () => {
    expect(() => new EntityDefinition({})).toThrow('"collection" is required')
  })
})
