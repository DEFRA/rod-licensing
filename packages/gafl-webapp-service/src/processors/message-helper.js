export const youOrOther = permission => {
  if (permission.isLicenceForYou) {
    return 'you'
  } else {
    return 'other'
  }
}
