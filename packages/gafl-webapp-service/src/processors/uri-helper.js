export const addLanguageCodeToUri = (request, uri) => {
  const path = uri || request.path

  if (/.*lang=cy.*/.test(path)) {
    return path
  }

  const languageSpecifier = /.*\?.*/.test(path) ? '&lang=cy' : '?lang=cy'
  return `${path}${/\?.*lang=cy.*$/.test(request.url.search) ? languageSpecifier : ''}`
}
