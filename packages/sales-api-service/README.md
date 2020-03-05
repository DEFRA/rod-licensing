# Rod Licencing - Sales API

The Rod Licencing Sales API is responsible for communication with Microsoft Dynamics, processing sales from each of the sales channels and managing reference data.

# Environment variables

| name                  | description              | required | default         | valid                                                                                          | notes                                                                |
| --------------------- | ------------------------ | :------: | --------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| NODE_ENV              | Node environment         |    no    |                 | development,test,production                                                                    |                                                                      |
| PORT                  | Port number              |    no    | 3000            |                                                                                                |                                                                      |
| AWS_REGION            | The AWS region to use    |   yes    |                 | See [AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande.html#regional-endpoints) |                                                                      |
| AWS_SQS_ENDPOINT      | Custom SQS Endpoint      |    no    | Region specific |                                                                                                | Used to override the SQS service endpoint for local development      |
| AWS_DYNAMODB_ENDPOINT | Custom DynamoDB Endpoint |    no    | Region specific |                                                                                                | Used to override the DynamoDB service endpoint for local development |

# Prerequisites

See main project [project](../../README.md) documentation.

# Running the application

`$ npm start`
