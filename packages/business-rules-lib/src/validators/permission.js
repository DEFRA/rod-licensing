export const createPermissionNumberValidator = joi =>
  joi
    .string()
    .trim()
    .pattern(/^\d{8}-\d[A-Z]{2}\d[A-Z]{3}-[A-HJ-NP-Z0-9]{6}$/)
    .required()
    .description('The permission reference number')
    .example('17030621-3WC3FFT-U6HLG9')

export const permissionNumberUniqueComponentValidator = joi =>
  joi
    .string()
    .trim()
    .pattern(/^[A-Z0-9]{6}$/)
    .required()
    .description('The unqiue part of the permission reference number')
    .example('U6HLG9')
