import HapiSwagger from 'hapi-swagger'
import Project from '../../project.cjs'
export default {
  plugin: HapiSwagger,
  options: {
    info: {
      title: 'Rod Licencing Sales API Documentation',
      version: Project.packageJson.version
    },
    grouping: 'tags',
    sortEndpoints: 'ordered'
  }
}
