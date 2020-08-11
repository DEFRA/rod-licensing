import moment from 'moment'
import { JUNIOR_MAX_AGE, MINOR_MAX_AGE, SENIOR_MIN_AGE, ADVANCED_PURCHASE_MAX_DAYS } from '@defra-fish/business-rules-lib'

export const DATE_AT_ADVANCED_PURCHASE_MAX_DAYS = moment().add(ADVANCED_PURCHASE_MAX_DAYS, 'day')
export const MINOR_AT_ADVANCE_PURCHASE_MAX = moment()
  .add(ADVANCED_PURCHASE_MAX_DAYS, 'day')
  .subtract(MINOR_MAX_AGE + 1, 'years')
  .add(1, 'day')
export const JUNIOR_AT_ADVANCE_PURCHASE_MAX = moment()
  .add(ADVANCED_PURCHASE_MAX_DAYS, 'day')
  .subtract(MINOR_MAX_AGE + 1, 'years')

export const JUNIOR_TODAY = moment().subtract(MINOR_MAX_AGE + 1, 'years')

export const JUNIOR_TOMORROW = moment()
  .subtract(MINOR_MAX_AGE + 1, 'years')
  .add(1, 'day')

export const ADULT_TODAY = moment().subtract(JUNIOR_MAX_AGE + 1, 'years')

export const ADULT_TOMORROW = moment()
  .subtract(JUNIOR_MAX_AGE + 1, 'years')
  .add(1, 'day')

export const SENIOR_TODAY = moment().add(-SENIOR_MIN_AGE, 'years')

export const SENIOR_TOMORROW = moment()
  .add(-SENIOR_MIN_AGE, 'years')
  .add(1, 'day')

export const postDateHelper = (d, prefix) => ({
  [`${prefix}-day`]: d.date().toString(),
  [`${prefix}-month`]: (d.month() + 1).toString(),
  [`${prefix}-year`]: d.year()
})

export const dobHelper = d => postDateHelper(d, 'date-of-birth')
export const startDateHelper = d => postDateHelper(d, 'licence-start-date')
