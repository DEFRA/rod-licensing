# Rod Licensing - Connectors Lib

Provides connectivity to the resources/infrastructure used in the rod licensing services

# Environment variables

| name                                | description                                                        | required | default         | valid                                                                                          | notes                                                                       |
| ----------------------------------- | ------------------------------------------------------------------ | :------: | --------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| AWS_REGION                          | The AWS region to use                                              |   yes    |                 | See [AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande.html#regional-endpoints) |                                                                             |
| AWS_ACCESS_KEY_ID                   | AWS Access Key (required if running outside of AWS or without IAM) |  maybe   |                 | development, test, production                                                                  | Set to "local" when running with local infrastructure                       |
| AWS_SECRET_ACCESS_KEY               | AWS Secret Key (required if running outside of AWS or without IAM) |  maybe   |                 | development, test, production                                                                  | Set to "local" when running with local infrastructure                       |
| AWS_S3_ENDPOINT                     | Custom S3 Endpoint                                                 |    no    | Region specific |                                                                                                | Used to override the S3 service endpoint for local development              |
| AWS_SQS_ENDPOINT                    | Custom SQS Endpoint                                                |    no    | Region specific |                                                                                                | Used to override the SQS service endpoint for local development             |
| AWS_DYNAMODB_ENDPOINT               | Custom DynamoDB Endpoint                                           |    no    | Region specific |                                                                                                | Used to override the DynamoDB service endpoint for local development        |
| AWS_SECRETS_MANAGER_ENDPOINT        | Custom Secrets Manager Endpoint                                    |    no    | Region specific |                                                                                                | Used to override the Secrets Manager service endpoint for local development |
| AWS_NODEJS_CONNECTION_REUSE_ENABLED | Enable connection keep-alive in the AWS connectors                 |    no    | Disabed         | 1 or 0                                                                                         | Recommended to enable connection reuse / keep-alive                         |
| SALES_API_URL                       | URL for the sales API                                              |    no    |                 |                                                                                                |                                                                             |
| SALES_API_TIMEOUT_MS                | Request timeout for the requests to the sales API                  |    no    | 20000 (20s)     |                                                                                                |                                                                             |
| GOV_PAY_API_URL                     | The GOV.UK Pay API base url                                        |   yes    |                 |                                                                                                |                                                                             |
| GOV_PAY_APIKEY                      | GOV pay access identifier                                          |   yes    |                 |                                                                                                |                                                                             |
| GOV_PAY_REQUEST_TIMEOUT_MS          | Timeout in milliseconds for API requests                           |    no    | 10000           |                                                                                                |                                                                             |

# Prerequisites

See [main project documentation](../../README.md).
