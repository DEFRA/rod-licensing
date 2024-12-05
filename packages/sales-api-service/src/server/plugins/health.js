import HapiAndHealthy from 'hapi-and-healthy'
import { dynamicsClient } from '@defra-fish/dynamics-lib'
import Project from '../../project.cjs'
import { docClient, sqs } from '../../../../connectors-lib/src/aws.js'
import { ListTablesCommand } from '@aws-sdk/client-dynamodb'

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
          try {
            const tables = await docClient.send(new ListTablesCommand({}))
            return { connection: 'dynamodb', status: 'ok', TableNames: tables.TableNames }
          } catch (error) {
            return { connection: 'dynamodb', status: 'error', message: error.message }
          }
        },
        async () => {
          try {
            const queues = await sqs.listQueues().promise()
            return { connection: 'sqs', status: 'ok', QueueUrls: queues.QueueUrls }
          } catch (error) {
            return { connection: 'sqs', status: 'error', message: error.message }
          }
        }
      ]
    }
  }
}
