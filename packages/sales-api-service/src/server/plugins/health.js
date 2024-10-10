import HapiAndHealthy from 'hapi-and-healthy'
import { dynamicsClient } from '@defra-fish/dynamics-lib'
import Project from '../../project.cjs'
import { AWS } from '@defra-fish/connectors-lib'
import { ListTablesCommand } from '@aws-sdk/client-dynamodb'

const { ddb, sqs } = AWS() // ddb is using v3 client, sqs is using v2 client

export default {
  plugin: HapiAndHealthy,
  options: {
    id: Project.packageJson.name,
    env: process.env.NODE_ENV,
    name: Project.packageJson.description,
    version: Project.packageJson.version,
    custom: {
      versions: process.versions,
      dependencies: Project.packageJson.dependencies
    },
    tags: ['api', 'health'],
    test: {
      node: [
        async () => {
          return { connection: 'dynamics', status: 'ok', ...(await dynamicsClient.executeUnboundFunction('RetrieveVersion')) }
        },
        async () => {
          const listTablesResult = await ddb.send(new ListTablesCommand({}))
          return { connection: 'dynamodb', status: 'ok', ...listTablesResult }
        },
        async () => {
          return { connection: 'sqs', status: 'ok', ...(await sqs.listQueues().promise()) }
        }
      ]
    }
  }
}
