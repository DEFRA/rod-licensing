# Guidance for using docker

## Prerequisites

- Node v14+ (to execute npm helper scripts only)
- Docker v18.06.0+ (to run the docker services)

You'll also need to initialise a local docker swarm before you can run the infrastructure or services locally. To do so, run the following
command (you'll only need to do this once):

```shell script
docker swarm init
```

## Infrastructure

The [infrastructure.yml](infrastructure.yml) docker-compose file contains everything that the service depends on to run.

To start the infrastructure, run the following command in the root of the rod-licensing repository:

```shell script
npm run docker:infrastructure
```

This will start a docker stack named `rli` you should be able to see this listed by typing `docker stack ls`
Should you need to, this stack can be terminated by running `docker stack rm rli`

The services exposed when this docker-compose file is executed are described below:

### DynamoDB

A local instance of DynamoDB is exposed on port 4569 and will be configured with the necessary tables to run the digital service locally

#### DynamoDB admin interface

The excellent DynamoDB administration tool by aaronshaf (see [aaronshaf/dynamodb-admin](https://github.com/aaronshaf/dynamodb-admin)) is
exposed on port 8002. This can be opened in your browser by visiting [http://localhost:8002/](http://localhost:8002/) where you will be
able to explore the content of each table and modify/delete records as necessary.

### SQS

A local instance of ElasticMQ is used to emulate SQS. It is exposed on port 9324 and will be configured with the necessary FIFO SQS queues
to run the digital services locally.

Tips:

- You can purge all messages on a queue by executing the PurgeQueue action on a given QueueURL
  - For example: http://0.0.0.0:9324/queue/TransactionsQueue.fifo?Action=PurgeQueue

### S3

A local instance of S3 is exposed on port 4572 and will be created with the necessary buckets to run the service.

### Redis

A local instance of Redis will be exposed on port 6379. It is used by the:

- gafl-webapp-service - to manage sessions
- sales-api-service - to cache reference data

#### Redis Insights

The redis-insights tool can be used to explore the content of the redis store, it can be accessed via [http://localhost:8001/](http://localhost:8001/)

#### Redis Commander

Alternatively you can also use redis-commander which can be accessed via [http://localhost:8003/](http://localhost:8003/)

## Services

To support running the services locally using docker, there are three different docker-compose files:

- [services.build.yml](services.build.yml)
  > This contains the necessary definitions to allow docker images to be built both in development and production mode
- [services.dev.yml](services.dev.yml)
  > This contains the necessary definitions to allow the services to be run in development mode.
  > In development mode, the images mount the filesystem of the host to execute the service in containers. This is useful
  > to quickly run all of the services and containers will automatically restart whenever changes are made to the source.
  > This is accomplished by using pm2-dev which automatically watches the filesystem for changes.
- [services.yml](services.yml)
  > This contains the necessary definitions to allow the services to be run in production mode.
  > Building the containers in production mode takes longer as all node modules need to be installed and additional build
  > steps such as compiling SASS need to be performed.

In order to run the services locally, you'll need to place an environment file under `docker/.env` within the repository.

This file contains all of the necessary environment variables to run the services locally:

```dotenv
NODE_ENV=development

# Global Redis
REDIS_HOST=host.docker.internal
REDIS_PORT=6379

# Global URLs
SALES_API_URL=http://host.docker.internal:4000

# Global AWS
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
AWS_SQS_ENDPOINT=http://host.docker.internal:9324
AWS_DYNAMODB_ENDPOINT=http://host.docker.internal:4569

# Dynamics API
OAUTH_AUTHORITY_HOST_URL=https://login.microsoftonline.com/
OAUTH_TENANT=<<redacted>>

# Dynamics API settings specific to each host
OAUTH_CLIENT_ID=<<redacted>>
OAUTH_CLIENT_SECRET=<<redacted>>
DYNAMICS_API_PATH=https://<<redacted>>/api/data/v9.1/
DYNAMICS_API_VERSION=9.1
OAUTH_RESOURCE=https://<<redacted>>/

# Sales API
# Note: shares the TRANSACTIONS_QUEUE_URL environment variable defined below under SQS Receiver
TRANSACTIONS_STAGING_TABLE=TransactionStaging
DEBUG=sales:*

# SQS Receiver
TRANSACTIONS_QUEUE_URL=http://host.docker.internal:9324/queue/TransactionsQueue.fifo
TRANSACTIONS_QUEUE_MAX_POLLING_INTERVAL_MS=30000
TRANSACTIONS_QUEUE_VISIBILITY_TIMEOUT_MS=120000
TRANSACTIONS_QUEUE_SUBSCRIBER=http://host.docker.internal:4000/process-queue

TRANSACTIONS_DLQ_URL=http://host.docker.internal:9324/queue/TransactionsDlq.fifo
TRANSACTIONS_DLQ_MAX_POLLING_INTERVAL_MS=180000
TRANSACTIONS_DLQ_VISIBILITY_TIMEOUT_MS=120000
TRANSACTIONS_DLQ_SUBSCRIBER=http://host.docker.internal:4000/process-dlq
```

### How to run

There are a number of convenience scripts setup in the root `package.json`

#### Production mode

To build the images:

```shell script
npm run docker:build
```

To run the services:

```shell script
npm run docker:services
```

To stop the running services

```shell script
docker stack rm rls
```

#### Development mode

Ensure that you have the packages properly setup on your host system by running `npm install` in the root of the repository.

To build the images:

```shell script
npm run docker:build-dev
```

To run the services:

```shell script
npm run docker:services-dev
```

To stop the running services

```shell script
docker stack rm rls
```
