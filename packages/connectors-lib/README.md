# Rod Licensing - Connectors Lib

Provides connectivity to the resources/infrastructure used in the rod licensing services

# Environment variables

| name                  | description                                                        | required | default         | valid                                                                                          | notes                                                                |
| --------------------- | ------------------------------------------------------------------ | :------: | --------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| AWS_REGION            | The AWS region to use                                              |   yes    |                 | See [AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande.html#regional-endpoints) |                                                                      |
| AWS_ACCESS_KEY_ID     | AWS Access Key (required if running outside of AWS or without IAM) |  maybe   |                 | development, test, production                                                                  | Set to "local" when running with local infrastructure                |
| AWS_SECRET_ACCESS_KEY | AWS Secret Key (required if running outside of AWS or without IAM) |  maybe   |                 | development, test, production                                                                  | Set to "local" when running with local infrastructure                |
| AWS_SQS_ENDPOINT      | Custom SQS Endpoint                                                |    no    | Region specific |                                                                                                | Used to override the SQS service endpoint for local development      |
| AWS_DYNAMODB_ENDPOINT | Custom DynamoDB Endpoint                                           |    no    | Region specific |                                                                                                | Used to override the DynamoDB service endpoint for local development |

# Prerequisites

See [main project documentation](../../README.md).
