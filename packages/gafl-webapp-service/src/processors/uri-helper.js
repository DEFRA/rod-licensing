export const addLanguageCodeToUri = (request, uri) => {
  const path = uri || request.path

  // Remove any existing lang parameters
  const cleanPath = path.replace(/[?|&]lang=[a-z]{2}/, '')

  const languageSpecifier = /.*\?.*/.test(cleanPath) ? '&lang=cy' : '?lang=cy'
  return `${cleanPath}${/\?.*lang=cy.*$/.test(request.url.search) ? languageSpecifier : ''}`
}

export const addEmptyFragmentToUri = path => {
  // Remove any existing fragments
  const cleanPath = path.split('#')[0]
  return `${cleanPath}#`
}
