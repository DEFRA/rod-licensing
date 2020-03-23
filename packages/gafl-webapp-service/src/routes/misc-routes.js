export default [
  {
    method: 'GET',
    path: '/',
    handler: async (request, h) => h.redirect('/buy')
  }
]
