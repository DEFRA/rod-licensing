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

export const licenceStartDateValid = (day, month, year, value, helpers) => {
  const dayNum = Number(day)
  const monthNum = Number(month)
  const yearNum = Number(year)

  const dayInvalid = dayNum < 1 || dayNum > 31
  const monthInvalid = monthNum < 1 || monthNum > 12

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

  if (dayNum < 1 || dayNum > 31) {
    errors.push('day')
  }
  if (monthNum < 1 || monthNum > 12) {
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
  }

  return isLeapYear(dayNum, monthNum, yearNum, value, helpers)
}

const isLeapYear = (day, month, year, value, helpers) => {
  if (month === 2) {
    const leapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    const maxDay = leapYear ? 29 : 28
    if (day > maxDay) {
      return { value, errors: helpers.error(invalidDay) }
    }
  } else if ([4, 6, 9, 11].includes(month)) {
    if (day > 30) {
      return { value, errors: helpers.error(invalidDay) }
    }
  } else {
    return null
  }
  return null
}
