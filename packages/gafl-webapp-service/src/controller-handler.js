/**
 * This is the default controller
 */
export default async (request, h) => {
  console.log('controller')
  return h.redirect('/name')
}
