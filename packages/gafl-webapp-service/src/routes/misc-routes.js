export default [
  {
    method: '*',
    path: '/{p*}',
    handler: async (request, h) => h.redirect('/controller')
  }
]
