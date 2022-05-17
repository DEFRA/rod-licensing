export const addLanguageCodeToUri = (request, uri) => {
  const path = uri || request.path
  console.log('decorating', path)
  const appendWith = /.*\?.*/.test(path) ? '&' : '?'
  console.log('appendWith', appendWith)
  return `${path}${/\?.*lang=cy.*$/.test(request.url.search) ? `${appendWith}lang=cy` : ''}`
}
