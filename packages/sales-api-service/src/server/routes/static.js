import Path from 'path'
import Project from '../../project.cjs'
export default [
  {
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: Path.join(Project.root, 'src/server/static/'),
        redirectToSlash: true,
        index: ['index.html'],
        listing: true
      }
    }
  }
]
