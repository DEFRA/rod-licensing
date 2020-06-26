export const addressLookupResults = {
  FOUND_SOME: 'found-some',
  FOUND_NONE: 'found-none'
}

export default async request => {
  const { addresses } = await request.cache().helpers.addressLookup.getCurrentPermission()
  return addresses.length ? addressLookupResults.FOUND_SOME : addressLookupResults.FOUND_NONE
}
