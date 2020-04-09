import HapiAndHealthy from 'hapi-and-healthy'
import { dynamicsClient } from '@defra-fish/dynamics-lib'
import Project from '../../project.cjs'
import AWS from '../../services/aws.js'
const { ddb, sqs } = AWS()

export default {
  plugin: HapiAndHealthy,
  options: {
    id: Project.packageJson.name,
    name: Project.packageJson.description,
    tags: ['api', 'health'],
    test: {
      node: [
        async () => {
          return { connection: 'dynamics', status: 'ok', ...(await dynamicsClient.executeUnboundFunction('RetrieveVersion')) }
        },
        async () => {
          return { connection: 'dynamodb', status: 'ok', ...(await ddb.listTables().promise()) }
        },
        async () => {
          return { connection: 'sqs', status: 'ok', ...(await sqs.listQueues().promise()) }
        }
      ]
    }
  }
}
