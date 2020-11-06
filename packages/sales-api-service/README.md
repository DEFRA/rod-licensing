# Rod Licensing - Sales API

The Rod Licensing Sales API is responsible for communication with Microsoft Dynamics, processing sales from each of the sales channels and managing reference data.

# Environment variables

| name                                  | description                                                                        | required | default   | valid                         | notes |
| ------------------------------------- | ---------------------------------------------------------------------------------- | :------: | --------- | ----------------------------- | ----- |
| NODE_ENV                              | Node environment                                                                   |    no    |           | development, test, production |       |
| PORT                                  | Port number                                                                        |    no    | 4000      |                               |       |
| TRANSACTION_STAGING_TABLE             | The DynamoDB table used for transaction staging                                    |   yes    |           |                               |       |
| TRANSACTION_STAGING_TABLE_TTL         | The time to live for records in the transaction staging table (in seconds)         |    no    | 168 hours |                               |       |
| TRANSACTION_STAGING_HISTORY_TABLE     | The DynamoDB table used for transaction staging history                            |   yes    |           |                               |       |
| TRANSACTION_STAGING_HISTORY_TABLE_TTL | The time to live for records in the transaction staging history table (in seconds) |    no    | 90 days   |                               |       |
| PAYMENT_JOURNALS_TABLE                | The DynamoDB table used for payment journals                                       |   yes    |           |                               |       |
| PAYMENT_JOURNALS_TABLE_TTL            | The time to live for records in the payment journals table (in seconds)            |    no    | 168 hours |                               |       |
| TRANSACTION_QUEUE_URL                 | The SQS queue URL used for processing transactions                                 |   yes    |           |                               |       |
| HAPI_KEEP_ALIVE_TIMEOUT_MS            | Configure the keep-alive timeout on the server listener                            |    no    | 1 minute  |                               |       |
| AIRBRAKE_HOST                         | URL of airbrake host                                                               |    no    |           |                               |       |
| AIRBRAKE_PROJECT_KEY                  | Project key for airbrake logging                                                   |    no    |           |                               |       |

### See also:

- Environment variables [required by the connectors-lib package](../connectors-lib/README.md).
- Environment variables [required by the dynamics-lib package](../dynamics-lib/README.md).

# Prerequisites

See [main project documentation](../../README.md).

# Running the application

`$ npm start`
