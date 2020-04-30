// Process the country code option set into a useful form
export default c =>
  Object.values(c)
    .map(p => ({
      code: p.description,
      name: p.label
    }))
    .sort(a => (a.code === 'GB' ? -1 : 0))
