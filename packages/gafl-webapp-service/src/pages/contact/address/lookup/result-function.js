export default async request => {
  const { addresses } = await request.cache().helpers.addressLookup.getCurrentPermission()
  return addresses.length ? 'foundSome' : 'foundNone'
}
