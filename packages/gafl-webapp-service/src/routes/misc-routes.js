export default [
  {
    method: '*',
    path: '/{p*}',
    handler: async (request, h) => {
      return h.redirect('/controller')
    }
  }
]
