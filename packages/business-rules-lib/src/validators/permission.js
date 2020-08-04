/**
 * Validate a permission reference number.
 *
 * NOTE: This has been deliberately kept loose to allow for old-style licence numbers which used hex format for the last section
 *
 * @param joi
 * @returns {this}
 */
export const createPermissionNumberValidator = joi =>
  joi
    .string()
    .trim()
    .uppercase()
    .pattern(/^\d{8}-\d[A-Z]{2}\d[A-Z]{3}-[A-Z0-9]{6}$/)
    .required()
    .description('The permission reference number')
    .example('17030621-3WC3FFT-B6HLG9')

/**
 * Validate the last section of the permission reference number.
 *
 * NOTE: This has been deliberately kept loose to allow for old-style licence numbers which used hex format for the last section
 *
 * @param joi
 * @returns {this}
 */
export const permissionNumberUniqueComponentValidator = joi =>
  joi
    .string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9]{6}$/)
    .required()
    .description('The unique part of the permission reference number')
    .example('B6HLG9')
