export const addLanguageCodeToUri = (request, uri) => {
  const path = uri || request.path
  const languageSpecifier = /.*\?.*/.test(path) ? '&lang=cy' : '?lang=cy'
  return `${path}${/\?.*lang=cy.*$/.test(request.url.search) ? languageSpecifier : ''}`
}
