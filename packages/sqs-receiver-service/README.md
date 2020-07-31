# sqs-receiver-service

This service is configured to poll a set of SQS queues and on receipt of a message from the queue it will notify a subscribing service.

If the response from the subscriber is successful the message will be removed from the queue. If not the message will become visible again after the visibility timeout and maybe reprocessed subject to the SQS re-drive policy.

# Environment variables

| name                                       | description                                                              | required | default            | valid                                                                                           | notes                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------ | :------: | ------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| NODE_ENV                                   | Node environment                                                         |    no    |                    | development, test, production                                                                   |                                                                                                                               |
| AWS_REGION                                 | The AWS region to use                                                    |   yes    |                    | See [AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande.html#regional-endpoints)  |                                                                                                                               |
| AWS_SQS_ENDPOINT                           | Custom SQS Endpoint                                                      |    no    | Region specific    |                                                                                                 | Used to override the SQS service endpoint for local development                                                               |
| RECEIVER_PREFIX                            | Prefix for reading environment variables specific to a receiver instance |   yes    |                    |                                                                                                 | The prefix to use to retrieve further settings via the environment (see below)                                                |
| <RECEIVER_PREFIX>\_URL                     | The SQS queue URL                                                        |   yes    |                    |                                                                                                 |                                                                                                                               |
| <RECEIVER_PREFIX>\_WAIT_TIME_MS            | The amount of time to block while long polling a queue for messages      |    no    | 20000 (20 seconds) |                                                                                                 |                                                                                                                               |
| <RECEIVER_PREFIX>\_VISIBILITY_TIMEOUT_MS   | The length of time the message is made invisible to other processes      |   yes    |                    |                                                                                                 |                                                                                                                               |
| <RECEIVER_PREFIX>\_MAX_POLLING_INTERVAL_MS | The maximum amount of time to wait between subsequent read requests      |    no    | 300000 (5 minutes) |                                                                                                 | For each read request returning no messages, an exponential delay is calculated before reading again. This limits that delay. |
| <RECEIVER_PREFIX>\_ATTEMPTS_WITH_NO_DELAY  | Number of receive requests with no messages before imposing a delay      |    no    | 10                 |                                                                                                 | Receive message requests may return no messages even if there are messages waiting. Allow this many requests before delaying. |
| <RECEIVER_PREFIX>\_SUBSCRIBER              | The location of the subscriber. The message group id is appended         |   yes    |                    |                                                                                                 |                                                                                                                               |
| <RECEIVER_PREFIX>\_SUBSCRIBER_TIMEOUT_MS   | Prefix for reading environment variables specific to a receiver instance |    no    | 180000 (3m)        |                                                                                                 |                                                                                                                               |
| DEBUG                                      | Enable debug output                                                      |    no    |                    | sqs:\*, sqs:receiver, sqs:read-queue, sqs:process-message, sqs:delete-messages, sqs:queue-stats | Enables debug output for the given category, accepts wildcards                                                                |

## To control via pm2

`pm2 [start|restart|stop|delete] ecosystem.config.js`

The `ecosystem.config.js` file contains the set of receiver services to run. An example entry is shown:

```apps:
   - script: ./index.js
     name: 'Sales Queue'
     env:
       RECEIVER_PREFIX: SALES_QUEUE
     output: ./logs/sales-queue.out
     error: ./logs/sales-queue.err
     autorestart: false
```

## Debug

The service uses the debug package see the DEBUG environment variable guidance

## Failures

The service will fail early where a general error reading an SQS queue is encountered such as ECONNREFUSED

In the case of all http errors reading SQS queues the service will log the error continue.
See: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/CommonErrors.html

In the case of all errors encountered in the subscriber process queues the service will log the error continue

Only in the cases where the subscriber return an http success status will the message be removed from the SQS queue

## A development environment can be set up as follows

```
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
AWS_SQS_ENDPOINT=http://0.0.0.0:9324

DEBUG=sqs:*

TRANSACTION_QUEUE_URL=http://0.0.0.0:9324/queue/TransactionsQueue.fifo
TRANSACTION_QUEUE_MAX_POLLING_INTERVAL_MS=30000
TRANSACTION_QUEUE_VISIBILITY_TIMEOUT_MS=300000
TRANSACTION_QUEUE_SUBSCRIBER=http://0.0.0.0:4000/process-queue

TRANSACTION_DLQ_URL=http://0.0.0.0:9324/queue/TransactionsDlq.fifo
TRANSACTION_DLQ_MAX_POLLING_INTERVAL_MS=180000
TRANSACTION_DLQ_VISIBILITY_TIMEOUT_MS=300000
TRANSACTION_DLQ_SUBSCRIBER=http://0.0.0.0:4000/process-dlq
```
