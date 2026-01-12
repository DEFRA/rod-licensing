import { runValidators } from '../validators.js'

describe('runValidators', () => {
	it('runs all validators without throwing when every validator succeeds', () => {
		const validatorOne = jest.fn()
		const validatorTwo = jest.fn()
		const payload = { referenceNumber: 'AB1234' }

		expect(() => runValidators([validatorOne, validatorTwo], payload)).not.toThrow()

		expect(validatorOne).toHaveBeenCalledWith(payload)
		expect(validatorTwo).toHaveBeenCalledWith(payload)
	})

	it('re-throws the original error when a single validator fails', () => {
		const error = new Error('validation failed')
		const failingValidator = () => {
			throw error
		}

		expect(() => runValidators([failingValidator], {})).toThrow(error)
	})

	it('merges error details when multiple validators fail', () => {
		const firstError = new Error('first failure')
		firstError.details = [{ message: 'first issue', path: ['fieldOne'] }]
		const secondError = new Error('second failure')
		secondError.details = [{ message: 'second issue', path: ['fieldTwo'] }]

		const firstValidator = () => {
			throw firstError
		}
		const secondValidator = () => {
			throw secondError
		}

		try {
			runValidators([firstValidator, secondValidator], { foo: 'bar' })
			throw new Error('Expected runValidators to throw')
		} catch (err) {
			expect(err).toBeInstanceOf(Error)
			expect(err.message).toEqual('expected error')
			expect(err.details).toEqual([
				{ message: 'first issue', path: ['fieldOne'] },
				{ message: 'second issue', path: ['fieldTwo'] }
			])
		}
	})
})
