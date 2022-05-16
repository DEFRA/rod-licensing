export const addLanguageCodeToUri = (request, uri) => {
  const path = uri || request.path
  return `${path}${/\?.*lang=cy.*$/.test(request.url.search) ? '?lang=cy' : ''}`
}
