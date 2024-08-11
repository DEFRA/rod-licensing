// Day field is outside of range
export const createDayValidator = joi => joi.number().integer().min(1).max(31).required()

// Month field is outside of range
export const createMonthValidator = joi => joi.number().integer().min(1).max(12).required()

// Year field is outside of range
// Date too far in past
export const createYearValidator = (joi, minYear, maxYear) => joi.number().integer().min(minYear).max(maxYear).required()

// Non-numeric character entered
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
      for (const i in enteredDate) {
        if (enteredDate[i] !== deconstructedDate[i]) {
          return { value, errors: helpers.error('date.real') }
        }
      }
      return { value }
    }
  })
