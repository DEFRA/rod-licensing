
export const getTrackingProductDetailsFromTransaction = transaction =>
  transaction.permissions.map(permission => ({
    id: permission.permit.description,
    name: `${permission.permit.permitSubtype.label} - ${permission.permit.numberOfRods} rod(s) licence`,
    brand: permission.permit.permitType.label,
    category: [
      permission.permit.permitSubtype.label,
      `${permission.permit.numberOfRods} rod(s)`,
      permission.permit.concessions.length ? permission.permit.concessions.join(',') : 'Full'
    ].join('/'),
    variant: `${permission.permit.durationMagnitude} ${permission.permit.durationDesignator.label}`,
    quantity: 1,
    price: permission.permit.cost
  }))
