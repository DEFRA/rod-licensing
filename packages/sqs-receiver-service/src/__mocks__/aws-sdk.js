'use strict'

import { v4 as uuidv4 } from 'uuid'
const AwsSdk = jest.genMockFromModule('aws-sdk')

let result
let exception
let deleteFailures

AwsSdk.__mockEmptyQueue = () => {
  exception = null
  result = Object.create({})
}

AwsSdk.__mockOneMessage = () => {
  exception = null
  result = Object.create({
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    },
    Messages: [
      {
        MessageId: '15eb8abc-c7c1-4167-9590-839c8feed6dd',
        ReceiptHandle: '15eb8abc-c7c1-4167-9590-839c8feed6dd#9be8971c-f9a9-4bb2-8515-98cdab660e1b',
        MD5OfBody: '640ad880b5be372fcb5c5ad8b5eb50af',
        Body: '{"id":"7f6e04fe-4cec-4f40-b763-8c66d71062d9"}',
        Attributes: {
          MessageGroupId: 'service-1'
        }
      }
    ]
  })
}

AwsSdk.__mockNMessages = n => {
  exception = null
  result = Object.create(
    (result = Object.create({
      ResponseMetadata: {
        RequestId: '00000000-0000-0000-0000-000000000000'
      },
      Messages: []
    }))
  )
  for (let i = 0; i < n; i++) {
    result.Messages.push({
      MessageId: uuidv4(),
      ReceiptHandle: '15eb8abc-c7c1-4167-9590-839c8feed6dd#9be8971c-f9a9-4bb2-8515-98cdab660e1b',
      MD5OfBody: '640ad880b5be372fcb5c5ad8b5eb50af',
      Body: `{"id":"${uuidv4()}"}`,
      Attributes: {
        MessageGroupId: 'service-1'
      }
    })
  }
}

AwsSdk.__mockFailNoQueue = () => {
  exception = new Error('connect ECONNREFUSED 0.0.0.0:9325')
  exception.code = 'NetworkingError'
}

AwsSdk.__mockNotFound = () => {
  exception = new Error('Not Found')
  exception.code = 404
}

AwsSdk.__mockAWSError = () => {
  result = []
  exception = new Error()
  exception = Object.assign(exception, {
    message: 'ReadCountOutOfRange; see the SQS docs.',
    code: 'ReadCountOutOfRange',
    time: '2020-03-05T10:27:42.852Z',
    statusCode: 400,
    retryable: false,
    retryDelay: 49.19455461172468
  })
}

AwsSdk.__mockDeleteMessages = () => {
  exception = null
  result = Object.create({
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    },
    Successful: [
      {
        Id: '705e5bc6-bd0f-4424-95aa-7caf9a8eaab4'
      },
      {
        Id: '7ae59705-333f-4d38-b5d9-2c71f4f4ecae'
      },
      {
        Id: '23207320-8c75-4a12-960d-b87455ce7826'
      }
    ],
    Failed: []
  })
}

const receiveMessage = () => {
  if (exception) {
    throw exception
  }
  return {
    promise: () => result
  }
}

AwsSdk.__mockDeleteMessageFailures = () => {
  deleteFailures = true
}

const deleteMessageBatch = params => {
  if (exception) {
    throw exception
  }

  result = () => {
    if (deleteFailures) {
      return {
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        },
        Successful: [],
        Failed: params.Entries.map(p => ({ Id: p.Id }))
      }
    } else {
      return {
        ResponseMetadata: {
          RequestId: '00000000-0000-0000-0000-000000000000'
        },
        Successful: params.Entries.map(p => ({ Id: p.Id })),
        Failed: []
      }
    }
  }

  return {
    promise: () => result()
  }
}

AwsSdk.SQS.mockImplementation(() => {
  return {
    receiveMessage: receiveMessage,
    deleteMessageBatch: deleteMessageBatch,
    getQueueAttributes: () => ({
      promise: () => ({
        Attributes: {
          ApproximateNumberOfMessagesDelayed: 0,
          ApproximateNumberOfMessagesNotVisible: 0,
          ApproximateNumberOfMessages: 0
        }
      })
    })
  }
})

export default AwsSdk
