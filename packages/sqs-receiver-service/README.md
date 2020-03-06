# sqs-receiver-service

This service is configured to poll a set of SQS queues and on receipt of a message from the queue it will notify a subscribing service.

If the response from the subscriber is successful the message will be removed from the queue. If not the message will become visible again after the visibility timeout and maybe reprocessed subject to the SQS re-drive policy.

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

There is a required set of environment variables which must be set for each receiver. For example:

```
SALES_QUEUE_URL=http://0.0.0.0:9325/queue/SalesQueue.fifo
SALES_QUEUE_POLLING_RATE_MS=10000
SALES_QUEUE_VISIBILITY_TIMEOUT_MS=120000
SALES_QUEUE_WAIT_TIME_MS=2000
SALES_QUEUE_NO_DELAY_THRESHOLD=4
SALES_QUEUE_SUBSCRIBER=http://localhost:4000
SALES_QUEUE_SUBSCRIBER_RATE_LIMIT_MS=200
SALES_QUEUE_SUBSCRIBER_PARALLEL_LIMIT=4
SALES_QUEUE_SUBSCRIBER_TIMEOUT_MS=5000
```

- URL - The SQS queue location
- POLLING_RATE_MS - The duration of the long poll
- VISIBILITY_TIMEOUT_MS - The length of time the message is made invisible to other processes
- WAIT_TIME_MS - The delay between polling events
- NO_DELAY_THRESHOLD - The number of messages above which the delay is not observed
- SUBSCRIBER - The location of the subscriber. The message group id is appended
- SUBSCRIBER_PARALLEL_LIMIT - The number of subscriber requests which can occur concurrently
- SUBSCRIBER_RATE_LIMIT_MS - The minimum time between requests to the subscriber

## Debug

The service uses the debug package use set `DEBUG=[receiver|queue-stats|process-message|read-queue|delete-messages]`

## Failures

The service will fail early where a general error reading an SQS queue is encountered such as ECONNREFUSED

In the case of all http errors reading SQS queues the service will log the error continue.
See: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/CommonErrors.html

In the case of all errors encountered in the subscriber process queues the service will log the error continue

Only in the cases where the subscriber return an http success status will the message be removed from the SQS queue
