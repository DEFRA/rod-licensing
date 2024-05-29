export const dateMissing = (day, month, year, value, helpers) => {
  if (!day && month && year) {
    return { value, errors: helpers.error('date.dayMissing') }
  }
  if (!day && !month && year) {
    return { value, errors: helpers.error('date.dayMonthMissing') }
  }
  if (!day && month && !year) {
    return { value, errors: helpers.error('date.dayYearMissing') }
  }
  if (day && !month && year) {
    return { value, errors: helpers.error('date.monthMissing') }
  }
  if (day && !month && !year) {
    return { value, errors: helpers.error('date.monthYearMissing') }
  }
  if (day && month && !year) {
    return { value, errors: helpers.error('date.yearMissing') }
  }
  if (!day && !month && !year) {
    return { value, errors: helpers.error('date.allMissing') }
  }
  return null
}

export const dateNotNumber = (day, month, year, value, helpers) => {
  const isNumber = str => /^\d+$/.test(str)
  const dayNotNumber = day && !isNumber(day)
  const monthNotNumber = month && !isNumber(month)
  const yearNotNumber = year && !isNumber(year)

  if (dayNotNumber && !monthNotNumber && !yearNotNumber) {
    return { value, errors: helpers.error('date.dayNotNumber') }
  }
  if (dayNotNumber && monthNotNumber && !yearNotNumber) {
    return { value, errors: helpers.error('date.dayMonthNotNumber') }
  }
  if (dayNotNumber && !monthNotNumber && yearNotNumber) {
    return { value, errors: helpers.error('date.dayYearNotNumber') }
  }
  if (!dayNotNumber && monthNotNumber && !yearNotNumber) {
    return { value, errors: helpers.error('date.monthNotNumber') }
  }
  if (!dayNotNumber && monthNotNumber && yearNotNumber) {
    return { value, errors: helpers.error('date.monthYearNotNumber') }
  }
  if (!dayNotNumber && !monthNotNumber && yearNotNumber) {
    return { value, errors: helpers.error('date.yearNotNumber') }
  }
  if (dayNotNumber && monthNotNumber && yearNotNumber) {
    return { value, errors: helpers.error('date.allNotNumber') }
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
      return { value, errors: helpers.error('date.dayMonthInvalid') }
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

  const dayInvalid = dayNum < 1 || dayNum > 31
  const monthInvalid = monthNum < 1 || monthNum > 12
  const yearInvalid = year.length !== 4

  if (dayInvalid && !monthInvalid && !yearInvalid) {
    return { value, errors: helpers.error(invalidDay) }
  } else if (dayInvalid && monthInvalid && !yearInvalid) {
    return { value, errors: helpers.error('date.dayMonthInvalid') }
  } else if (dayInvalid && !monthInvalid && yearInvalid) {
    return { value, errors: helpers.error('date.dayYearInvalid') }
  } else if (!dayInvalid && monthInvalid && !yearInvalid) {
    return { value, errors: helpers.error('date.monthInvalid') }
  } else if (!dayInvalid && monthInvalid && yearInvalid) {
    return { value, errors: helpers.error('date.monthYearInvalid') }
  } else if (!dayInvalid && !monthInvalid && yearInvalid) {
    return { value, errors: helpers.error('date.yearInvalid') }
  } else if (dayInvalid && monthInvalid && yearInvalid) {
    return { value, errors: helpers.error('date.allInvalid') }
  } else {
    return isLeapYear(dayNum, monthNum, yearNum, value, helpers)
  }
}

const isLeapYear = (day, month, year, value, helpers) => {
  if (month === 2) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    const maxDay = isLeapYear ? 29 : 28
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
