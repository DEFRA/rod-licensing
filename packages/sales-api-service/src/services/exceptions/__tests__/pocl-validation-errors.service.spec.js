import { createPoclValidationError, updatePoclValidationError, getPoclValidationErrors } from '../pocl-validation-errors.service.js'
import { persist, findById, PoclValidationError, executeQuery, findPoclValidationErrors } from '@defra-fish/dynamics-lib'
import { getGlobalOptionSetValue } from '../../reference-data.service.js'
import Boom from '@hapi/boom'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  findById: jest.fn(),
  persist: jest.fn(),
  executeQuery: jest.fn(),
  findPoclValidationErrors: jest.fn()
}))

const getPayload = () => ({
  id: 'test-id',
  createTransactionPayload: {
    dataSource: 'DDE File',
    serialNumber: '14345-48457J',
    permissions: [
      {
        licensee: {
          firstName: 'Daniel',
          lastName: 'Ricciardo',
          organisation: 'Fishy Endeavours',
          premises: '14 Howecroft Court',
          street: 'Eastmead Lane',
          town: 'Bristol',
          postcode: 'BS9 1HJ',
          country: 'GB-ENG',
          birthDate: '1989-07-01',
          email: 'daniel-ricc@example.com',
          mobilePhone: '07722 123456',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Email',
          preferredMethodOfReminder: 'Text',
          postalFulfilment: true
        },
        permitId: 'test-permit-id',
        startDate: '2021-06-15',
        concessions: [{ type: 'Blue Badge', referenceNumber: '123456789' }]
      }
    ]
  },
  finaliseTransactionPayload: {
    transactionFile: 'test-pocl-file.xml',
    payment: {
      timestamp: '2020-01-01T14:00:00Z',
      amount: 30,
      newPaymentSource: 'Direct Debit',
      source: 'Direct Debit',
      channelId: '948594',
      method: 'Cash'
    }
  },
  createTransactionError: {
    statusCode: 422,
    error: 'Data validation error',
    message: 'Error'
  }
})

const getValidationError = payload => ({
  ...payload.createTransactionPayload.permissions[0].licensee,
  serialNumber: payload.createTransactionPayload.serialNumber,
  dataSource: payload.createTransactionPayload.serialNumber.dataSource,
  transactionDate: payload.createTransactionPayload.permissions[0].issueDate,
  permitId: payload.createTransactionPayload.permissions[0].permitId,
  startDate: payload.createTransactionPayload.permissions[0].startDate,
  newStartDate: payload.createTransactionPayload.permissions[0].newStartDate,
  concessions: JSON.stringify(payload.createTransactionPayload.permissions[0].concessions),
  timestamp: payload.finaliseTransactionPayload.payment.timestamp,
  amount: payload.finaliseTransactionPayload.payment.amount,
  channelId: payload.finaliseTransactionPayload.payment.channelId,
  newPaymentSource: payload.finaliseTransactionPayload.payment.newPaymentSource,
  paymentSource: payload.finaliseTransactionPayload.payment.source,
  methodOfPayment: payload.finaliseTransactionPayload.payment.method,
  status: 'Ready for Processing',
  errorMessage: payload.errorMessage
})

jest.mock('../../reference-data.service.js', () => ({
  getGlobalOptionSetValue: async (name, lookup) => {
    const optionSets = {
      defra_poclvalidationerrorstatus: [
        { id: 910400000, label: 'Needs Review', description: 'Needs Review' },
        { id: 910400002, label: 'Processed', description: 'Processed' },
        { id: 910400001, label: 'Ready for Processing', description: 'Ready for Processing' }
      ],
      defra_paymenttype: [{ id: 910400001, label: 'Cash', description: 'Cash' }],
      defra_datasource: [{ id: 910400005, label: 'DDE File', description: 'DDE File' }],
      defra_preferredcontactmethod: [
        { id: 910400000, label: 'Email', description: 'Email' },
        { id: 910400003, label: 'Prefer not to be contacted', description: 'Prefer not to be contacted' },
        { id: 910400002, label: 'Text', description: 'Text' }
      ],
      defra_financialtransactionsource: [{ id: 910400002, label: 'Direct Debit', description: 'Direct Debit' }],
      defra_country: [{ id: 910400195, label: 'England', description: 'GB-ENG' }]
    }
    const optionSet = optionSets[name].find(os => os.description === lookup)
    if (optionSet) {
      return optionSet
    }
    throw new Error(`Optionset ${name}:${lookup} not found, should be defined in optionSets data for reference data mock`)
  }
}))

describe('POCL validation error service', () => {
  beforeEach(jest.clearAllMocks)

  describe('createPoclValidationError', () => {
    const getPayloadWithoutTransactionFile = () => {
      const payload = getPayload()
      delete payload.finaliseTransactionPayload.transactionFile
      return payload
    }

    it('maps the record to an instance of PoclValidationError', async () => {
      await createPoclValidationError(getPayloadWithoutTransactionFile(), 'test-pocl-file.xml')
      const [[[poclValidationError]]] = persist.mock.calls
      expect(poclValidationError).toBeInstanceOf(PoclValidationError)
    })

    it('creates the validation record', async () => {
      await createPoclValidationError(getPayloadWithoutTransactionFile(), 'test-pocl-file.xml')
      const [[[poclValidationError]]] = persist.mock.calls
      expect(poclValidationError).toMatchSnapshot()
    })

    // it('maps an invalid country to countryUV', async () => {
    //   const [[[poclValidationError]]] = persist.mock.calls
    //   expect(poclValidationError)
    // })
  })

  describe('updatePoclValidationError', () => {
    const getPayloadWithoutCreateTransactionError = () => {
      const payload = getPayload()
      delete payload.createTransactionError
      payload.errorMessage = 'Invalid email address'
      return payload
    }
    // let payload
    // beforeEach(async () => {
    //   payload = getPayload()
    //   delete payload.createTransactionError
    //   payload.errorMessage = 'Invalid email address'
    // })

    describe('when validation error record exists', () => {
      it('retrieves existing record', async () => {
        const payload = getPayloadWithoutCreateTransactionError()
        findById.mockResolvedValue(getValidationError(payload))
        await updatePoclValidationError('pocl-validation-error-id', payload)
        expect(findById).toBeCalledWith(PoclValidationError, 'pocl-validation-error-id')
      })

      describe('and status is not provided', () => {
        it('sets the status to "Needs Review"', async () => {
          const payload = getPayloadWithoutCreateTransactionError()
          findById.mockResolvedValue(getValidationError(payload))

          await updatePoclValidationError('pocl-validation-error-id', payload)

          const [[[poclValidationError]]] = persist.mock.calls
          expect(poclValidationError.status.label).toBe('Needs Review')
        })

        it('the state code is not set', async () => {
          const payload = getPayloadWithoutCreateTransactionError()
          findById.mockResolvedValue(getValidationError(payload))

          await updatePoclValidationError('pocl-validation-error-id', payload)

          const [[[poclValidationError]]] = persist.mock.calls
          expect(poclValidationError.stateCode).toBe(undefined)
        })

        it('updates the validation record', async () => {
          const payload = getPayloadWithoutCreateTransactionError()
          findById.mockResolvedValue(getValidationError(payload))

          await updatePoclValidationError('pocl-validation-error-id', payload)

          const [[[poclValidationError]]] = persist.mock.calls
          expect(poclValidationError).toMatchSnapshot()
        })
      })

      describe('and status equals "Processed"', () => {
        const getProcessedPayload = () => {
          const payload = getPayloadWithoutCreateTransactionError()
          payload.status = 'Processed'
          return payload
        }

        const updateAndRetrieveError = async () => {
          const payload = getProcessedPayload()
          await updatePoclValidationError('pocl-validation-error-id', payload)
          const [[[poclValidationError]]] = persist.mock.calls
          return poclValidationError
        }

        it('the status is set to "Processed"', async () => {
          const poclValidationError = await updateAndRetrieveError()
          expect(poclValidationError.status.label).toBe('Processed')
        })

        it('the state code is set to 1', async () => {
          const poclValidationError = await updateAndRetrieveError()
          expect(poclValidationError.stateCode).toBe(1)
        })

        it('updates the validation record', async () => {
          const poclValidationError = await updateAndRetrieveError()
          expect(poclValidationError).toMatchSnapshot()
        })
      })
    })

    describe('when the validation error record does not exist', () => {
      beforeAll(async () => {
        findById.mockResolvedValue(null)
      })

      it('throws a 404 error', async () => {
        await expect(updatePoclValidationError('pocl-validation-error-id', getPayloadWithoutCreateTransactionError())).rejects.toEqual(
          Boom.notFound('A POCL validation error with the given identifier could not be found')
        )
      })

      it('does not call persist to update record', async () => {
        try {
          await updatePoclValidationError('pocl-validation-error-id', getPayloadWithoutCreateTransactionError())
        } catch (err) {}
        expect(persist).not.toBeCalled()
      })
    })
  })

  describe('getPoclValidationErrors', () => {
    beforeAll(async () => {
      findPoclValidationErrors.mockReturnValue({ foo: 'bar' })
      executeQuery.mockResolvedValue([
        {
          fields: { some: 'fields' },
          entity: { test: 'result' }
        },
        {
          fields: { some: 'more fields' },
          entity: { another: 'result' }
        }
      ])
    })

    it('passes the "Ready for Processing" status to the findPoclValidationErrors query', async () => {
      const status = await getGlobalOptionSetValue(PoclValidationError.definition.mappings.status.ref, 'Ready for Processing')
      await getPoclValidationErrors()
      expect(findPoclValidationErrors).toHaveBeenCalledWith(status)
    })

    it('executes the output of the Pocl query', async () => {
      await getPoclValidationErrors()
      expect(executeQuery).toHaveBeenCalledWith({ foo: 'bar' })
    })

    it('returns the entities retrieved from Dynamics', async () => {
      const result = await getPoclValidationErrors()
      expect(result).toMatchSnapshot()
    })
  })
})
