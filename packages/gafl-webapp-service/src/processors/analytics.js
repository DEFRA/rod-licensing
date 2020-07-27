export const getTrackingProductDetailsFromTransaction = ({ permissions }) =>
  permissions.map(({ permit }) => ({
    id: permit.description,
    name: `${permit.permitSubtype.label} - ${permit.numberOfRods} rod(s) licence`,
    brand: permit.permitType.label,
    category: [
      permit.permitSubtype.label,
      `${permit.numberOfRods} rod(s)`,
      permit.concessions.length ? permit.concessions.map(c => c.name).join(',') : 'Full'
    ].join('/'),
    variant: `${permit.durationMagnitude} ${permit.durationDesignator.label}`,
    quantity: 1,
    price: permit.cost
  }))

export const getAffiliation = channel => {
  if (channel === 'telesales') {
    return 'Get a fishing licence service - Telephone sales'
  }
  return 'Get a fishing licence service - Web sales'
}
