import { Binding } from '../../binding.js'
import { salesApi } from '@defra-fish/connectors-lib'

/**
 * Type of identification shown for Senior Concession
 * (Uncancelled Passport, Birth Certificate, NHS Medical Card, Driving Licence, Previous Senior Licence)
 * – only populated for Senior Concession transactions from Horizon
 * @type {Binding}
 */
export const SeniorConcession = new Binding({
  element: 'SENIOR_ID',
  transform: async context => {
    const value = Binding.TransformTextOnly(context)
    return (
      value && {
        concession: {
          concessionId: (await salesApi.concessions.find({ name: 'Senior' })).id,
          proof: {
            type: context.value,
            referenceNumber: 'N/A'
          }
        }
      }
    )
  }
})

/**
 * Blue Badge – only populated for Disabled Concession
 * @type {Binding}
 */
export const BlueBadgeConcession = new Binding({
  element: 'DISABLED_ID_1',
  transform: async context => {
    const value = Binding.TransformTextOnly(context)
    return (
      value && {
        concession: {
          concessionId: (await salesApi.concessions.find({ name: 'Disabled' })).id,
          proof: {
            type: 'Blue Badge',
            referenceNumber: context.value
          }
        }
      }
    )
  }
})

/**
 * If claiming Personal IP or Disability Living allowance - National Insurance Number - only populated for Disabled Concession Licences
 * @type {Binding}
 */
export const PipConcession = new Binding({
  element: 'DISABLED_ID_2',
  transform: async context => {
    const value = Binding.TransformTextOnly(context)
    return (
      value && {
        concession: {
          concessionId: (await salesApi.concessions.find({ name: 'Disabled' })).id,
          proof: {
            type: 'National Insurance Number',
            referenceNumber: context.value
          }
        }
      }
    )
  }
})
