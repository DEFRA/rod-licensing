export const addLanguageCodeToUri = (request, uri) => {
  const path = uri || request.path

  // Remove any existing lang parameters
  const cleanPath = path.replace(/[?|&]lang=[a-z]{2}/, '')
  // Remove any fragments from the path
  const defraggedPath = cleanPath.split('#')[0]

  const languageSpecifier = /.*\?.*/.test(defraggedPath) ? '&lang=cy' : '?lang=cy'
  return `${defraggedPath}${/\?.*lang=cy.*$/.test(request.url.search) ? languageSpecifier : ''}`
}
