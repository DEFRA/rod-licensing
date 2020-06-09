import { BaseEntity, EntityDefinition } from '../entities/base.entity'

export default class TestEntity extends BaseEntity {
  static _definition = new EntityDefinition({
    localName: 'entityTest',
    dynamicsCollection: 'test',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: {
        field: 'idval',
        type: 'string'
      },
      strVal: {
        field: 'strval',
        type: 'string'
      },
      intVal: {
        field: 'intval',
        type: 'integer'
      },
      decVal: {
        field: 'decval',
        type: 'decimal'
      },
      boolVal: {
        field: 'boolval',
        type: 'boolean'
      },
      dateVal: {
        field: 'dateval',
        type: 'date'
      },
      dateTimeVal: {
        field: 'datetimeval',
        type: 'datetime'
      },
      optionSetVal: {
        field: 'optionsetval',
        type: 'optionset',
        ref: 'test_globaloption'
      }
    },
    alternateKey: 'strval',
    relationships: {
      parentTestEntity: { property: 'parent_test_entity', entity: TestEntity, parent: true },
      childTestEntity: { property: 'child_test_entity', entity: TestEntity }
    }
  })

  /**
   * @returns {EntityDefinition} the definition providing mappings between Dynamics entity and the local entity
   */
  static get definition () {
    return TestEntity._definition
  }

  /**
   * @returns {string} the strVal to test
   */
  get strVal () {
    return super._getState('strVal')
  }

  /**
   * Set the strVal to test
   * @param {string} strVal the strVal to set
   */
  set strVal (strVal) {
    super._setState('strVal', strVal)
  }

  /**
   * @returns {number} the intVal to test
   */
  get intVal () {
    return super._getState('intVal')
  }

  /**
   * Set the intVal to test
   * @param {number} intVal the intVal to set
   */
  set intVal (intVal) {
    super._setState('intVal', intVal)
  }

  /**
   * @returns {number} the decVal to test
   */
  get decVal () {
    return super._getState('decVal')
  }

  /**
   * Set the decVal to test
   * @param {number} decVal the decVal to set
   */
  set decVal (decVal) {
    super._setState('decVal', decVal)
  }

  /**
   * @returns {boolean} the boolVal to test
   */
  get boolVal () {
    return super._getState('boolVal')
  }

  /**
   * Set the boolVal to test
   * @param {boolean} boolVal the boolVal to set
   */
  set boolVal (boolVal) {
    super._setState('boolVal', boolVal)
  }

  /**
   * @returns {string|Date} the dateVal to test
   */
  get dateVal () {
    return super._getState('dateVal')
  }

  /**
   * Set the dateVal to test
   * @param {string|Date} dateVal the dateVal to set
   */
  set dateVal (dateVal) {
    super._setState('dateVal', dateVal)
  }

  /**
   * @returns {string|Date} the dateTimeVal to test
   */
  get dateTimeVal () {
    return super._getState('dateTimeVal')
  }

  /**
   * Set the dateTimeVal to test
   * @param {string|Date} dateTimeVal the dateTimeVal to set
   */
  set dateTimeVal (dateTimeVal) {
    super._setState('dateTimeVal', dateTimeVal)
  }

  /**
   * @returns {Object<GlobalOptionSetDefinition>} the optionSetVal to test
   */
  get optionSetVal () {
    return super._getState('optionSetVal')
  }

  /**
   * Set the optionSetVal to test
   * @param {Object<GlobalOptionSetDefinition>} optionSetVal the optionSetVal to set
   */
  set optionSetVal (optionSetVal) {
    super._setState('optionSetVal', optionSetVal)
  }
}
