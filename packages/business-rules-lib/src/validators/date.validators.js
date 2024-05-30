export const dateMissing = (day, month, year, value, helpers) => {
  const missingParts = []
  if (!day) {
    missingParts.push('day')
  }
  if (!month) {
    missingParts.push('month')
  }
  if (!year) {
    missingParts.push('year')
  }

  if (missingParts.length > 1) {
    const missingPartsCombined = missingParts.join('')
    const errorType = `date.${missingPartsCombined}Missing`
    return { value, errors: helpers.error(errorType) }
  } else if (missingParts.length === 1) {
    const errorType = `date.${missingParts}Missing`
    return { value, errors: helpers.error(errorType) }
  } else {
    return null
  }
}

export const dateNotNumber = (day, month, year, value, helpers) => {
  const notNumber = []
  if (isNaN(day)) {
    notNumber.push('day')
  }
  if (isNaN(month)) {
    notNumber.push('month')
  }
  if (isNaN(year)) {
    notNumber.push('year')
  }

  if (notNumber.length > 1) {
    const notNumberCombined = notNumber.join('')
    const errorType = `date.${notNumberCombined}NotNumber`
    return { value, errors: helpers.error(errorType) }
  } else if (notNumber.length === 1) {
    const errorType = `date.${notNumber}NotNumber`
    return { value, errors: helpers.error(errorType) }
  } else {
    return null
  }
}

const invalidDay = 'date.dayInvalid'

const FIRST_DAY = 1
const FIRST_MONTH = 1
const LAST_DAY = 31
const LAST_MONTH = 12

export const licenceStartDateValid = (day, month, year, value, helpers) => {
  const dayNum = Number(day)
  const monthNum = Number(month)
  const yearNum = Number(year)

  const dayInvalid = dayNum < FIRST_DAY || dayNum > LAST_DAY
  const monthInvalid = monthNum < FIRST_MONTH || monthNum > LAST_MONTH

  if (dayInvalid) {
    if (monthInvalid) {
      return { value, errors: helpers.error('date.daymonthInvalid') }
    }
    return { value, errors: helpers.error(invalidDay) }
  } else if (monthInvalid) {
    return { value, errors: helpers.error('date.monthInvalid') }
  } else {
    return isLeapYear(dayNum, monthNum, yearNum, value, helpers)
  }
}

export const birthDateValid = (day, month, year, value, helpers) => {
  const dayNum = Number(day)
  const monthNum = Number(month)
  const yearNum = Number(year)

  const errors = []

  if (dayNum < FIRST_DAY || dayNum > LAST_DAY) {
    errors.push('day')
  }
  if (monthNum < FIRST_MONTH || monthNum > LAST_MONTH) {
    errors.push('month')
  }
  if (year.length !== 4) {
    errors.push('year')
  }

  if (errors.length > 1) {
    const errorsCombined = errors.join('')
    const errorType = `date.${errorsCombined}Invalid`
    return { value, errors: helpers.error(errorType) }
  } else if (errors.length === 1) {
    const errorType = `date.${errors}Invalid`
    return { value, errors: helpers.error(errorType) }
  } else {
    return isLeapYear(dayNum, monthNum, yearNum, value, helpers)
  }
}

const LEAP_YEAR_DIVISOR_4 = 4
const LEAP_YEAR_DIVISOR_100 = 100
const LEAP_YEAR_DIVISOR_400 = 400
const DAYS_IN_FEB_LEAP_YEAR = 29
const DAYS_IN_FEB_NON_LEAP_YEAR = 28
const MAX_DAYS_IN_MONTH_WITH_30_DAYS = 30
const MONTH_FEBRUARY = 2
const MONTHS_WITH_30_DAYS = [4, 6, 9, 11]

const isLeapYear = (day, month, year, value, helpers) => {
  const isFebruary = month === MONTH_FEBRUARY
  const isMonthWith30Days = MONTHS_WITH_30_DAYS.includes(month)

  if (isFebruary) {
    const isLeapYear = (year % LEAP_YEAR_DIVISOR_4 === 0 && year % LEAP_YEAR_DIVISOR_100 !== 0) || year % LEAP_YEAR_DIVISOR_400 === 0
    const maxDay = isLeapYear ? DAYS_IN_FEB_LEAP_YEAR : DAYS_IN_FEB_NON_LEAP_YEAR
    if (day > maxDay) {
      return { value, errors: helpers.error(invalidDay) }
    }
  } else if (isMonthWith30Days) {
    if (day > MAX_DAYS_IN_MONTH_WITH_30_DAYS) {
      return { value, errors: helpers.error(invalidDay) }
    }
  }

  return null
}
