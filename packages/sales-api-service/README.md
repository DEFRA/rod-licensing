# Rod Licensing - Sales API

The Rod Licensing Sales API is responsible for communication with Microsoft Dynamics, processing sales from each of the sales channels and managing reference data.

# Environment variables

| name                           | description                                                                | required | default         | valid                                                                                          | notes                                                                |
| ------------------------------ | -------------------------------------------------------------------------- | :------: | --------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| NODE_ENV                       | Node environment                                                           |    no    |                 | development, test, production                                                                  |                                                                      |
| PORT                           | Port number                                                                |    no    | 4000            |                                                                                                |                                                                      |
| AWS_REGION                     | The AWS region to use                                                      |   yes    |                 | See [AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande.html#regional-endpoints) |                                                                      |
| AWS_SQS_ENDPOINT               | Custom SQS Endpoint                                                        |    no    | Region specific |                                                                                                | Used to override the SQS service endpoint for local development      |
| AWS_DYNAMODB_ENDPOINT          | Custom DynamoDB Endpoint                                                   |    no    | Region specific |                                                                                                | Used to override the DynamoDB service endpoint for local development |
| TRANSACTIONS_STAGING_TABLE     | The DynamoDB table used for transaction staging                            |   yes    |                 |                                                                                                |                                                                      |
| TRANSACTIONS_STAGING_TABLE_TTL | The time to live for records in the transaction staging table (in seconds) |    no    | 24 hours        |                                                                                                |                                                                      |
| TRANSACTIONS_QUEUE_URL         | The SQS queue URL used for processing transactions                         |   yes    |                 |                                                                                                |                                                                      |

See also the [environment variables required by the dynamics-lib package](../dynamics-lib/README.md).

# Prerequisites

See [main project documentation](../../README.md).

# Running the application

`$ npm start`
