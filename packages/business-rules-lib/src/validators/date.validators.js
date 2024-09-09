const MAX_DAY = 31
const MAX_MONTH = 12

export const createDayValidator = joi => joi.number().integer().min(1).max(MAX_DAY).required()

export const createMonthValidator = joi => joi.number().integer().min(1).max(MAX_MONTH).required()

export const createYearValidator = (joi, minYear, maxYear) => joi.number().integer().min(minYear).max(maxYear).required()

export const createNumericCharacterValidator = joi =>
  joi.string().trim().pattern(/^\d*$/).description('A string of numeric characters only').example('31')

export const createRealDateValidator = joi =>
  joi.object().extend({
    type: 'date',
    messages: {
      'date.real': '{{#label}} must be a real date'
    },
    validate (value, helpers) {
      const enteredDate = [value.year, value.month - 1, value.day]
      const constructedDate = new Date(Date.UTC(...enteredDate))
      const deconstructedDate = [constructedDate.getFullYear(), constructedDate.getMonth(), constructedDate.getDate()]
      for (let i = 0; i < enteredDate.length; i++) {
        if (enteredDate[i] !== deconstructedDate[i]) {
          return { value, errors: helpers.error('date.real') }
        }
      }
      return { value }
    }
  })
