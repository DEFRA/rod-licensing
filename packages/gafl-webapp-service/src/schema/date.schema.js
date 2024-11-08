'use strict'
import Joi from 'joi'

export const dateSchemaInput = (day, month, year) => ({
  'full-date': { day, month, year },
  'day-and-month': { day, month },
  'day-and-year': { day, year },
  'month-and-year': { month, year },
  day,
  month,
  year,
  'non-numeric': { day, month, year },
  'invalid-date': `${year}-${(month || '').padStart(2, '0')}-${(day || '').padStart(2, '0')}`
})

export const dateSchema = Joi.object({
  'full-date': Joi.object()
    .keys({
      day: Joi.any(),
      month: Joi.any(),
      year: Joi.any()
    })
    .or('day', 'month', 'year'),
  'day-and-month': Joi.object()
    .keys({
      day: Joi.any(),
      month: Joi.any()
    })
    .or('day', 'month'),
  'day-and-year': Joi.object()
    .keys({
      day: Joi.any(),
      year: Joi.any()
    })
    .or('day', 'year'),
  'month-and-year': Joi.object()
    .keys({
      month: Joi.any(),
      year: Joi.any()
    })
    .or('month', 'year'),
  day: Joi.any().required(),
  month: Joi.any().required(),
  year: Joi.any().required(),
  'non-numeric': Joi.object().keys({
    day: Joi.number(),
    month: Joi.number(),
    year: Joi.number()
  }),
  // 'invalid-date': Joi.date().iso().strict()
  'invalid-date': Joi.custom((dateToValidate, helpers) => {
    if ((new Date(dateToValidate)).toISOString() !== `${dateToValidate}T00:00:00.000Z`) {
      throw helpers.error('invalid-date')
    }

    return dateToValidate
  })
}).options({ abortEarly: true })
