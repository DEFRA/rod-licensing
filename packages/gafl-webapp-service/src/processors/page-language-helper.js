export const welshEnabledAndApplied = request => {
  const showWelshContent = process.env.SHOW_WELSH_CONTENT?.toLowerCase() === 'true'
  return showWelshContent && request.query.lang === 'cy'
}
