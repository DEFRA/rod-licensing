import { createDocumentClient } from '../documentclient-decorator'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/client-dynamodb')
jest.mock('@aws-sdk/lib-dynamodb')

describe('document client decorations', () => {
  beforeAll(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())
    DynamoDBDocument.from.mockReturnValue({
      query: jest.fn().mockResolvedValue({ Items: [], lastEvaluatedKey: false }),
      scan: jest.fn().mockResolvedValue({ Items: [], lastEvaluatedKey: false }),
      batchWrite: jest.fn().mockResolvedValue({ UnprocessedItems: {} })
    })
  })
  afterEach(jest.clearAllMocks)

  it('passes options to DynamoDB constructor', () => {
    const options = {
      option1: '1',
      option2: 2,
      option3: Symbol('option3')
    }
    createDocumentClient(options)
    expect(DynamoDB).toHaveBeenCalledWith(options)
  })

  it('creates DynamoDBDocument using client', () => {
    createDocumentClient()
    const [mockClient] = DynamoDB.mock.instances
    expect(DynamoDBDocument.from).toHaveBeenCalledWith(mockClient, expect.any(Object))
  })

  it('Sets options to strip empty and undefined values when marshalling to DynamoDB lists, sets and values', () => {
    createDocumentClient()
    expect(DynamoDBDocument.from).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        marshallOptions: {
          convertEmptyValues: true,
          removeUndefinedValues: true
        }
      })
    )
  })

  describe.each`
    aggregateMethod      | baseMethod
    ${'queryAllPromise'} | ${'query'}
    ${'scanAllPromise'}  | ${'scan'}
  `('$aggregateMethod', ({ aggregateMethod, baseMethod }) => {
    it('is added to document client', () => {
      const docClient = createDocumentClient()
      expect(docClient[aggregateMethod]).toBeDefined()
    })

    it(`passes arguments provided for ${aggregateMethod} to ${baseMethod}`, async () => {
      const params = { TableName: 'TEST', KeyConditionExpression: 'id = :id', ExpressionAttributeValues: { ':id': 1 } }
      const docClient = createDocumentClient()
      await docClient[aggregateMethod](params)
      expect(docClient[baseMethod]).toHaveBeenCalledWith(params)
    })

    it(`calls ${baseMethod} repeatedly until LastEvaluatedKey evaluates to false, concatenating all returned items`, async () => {
      const expectedItems = [
        { id: 1, data: Symbol('data1') },
        { id: 2, data: Symbol('data2') },
        { id: 3, data: Symbol('data3') },
        { id: 4, data: Symbol('data4') },
        { id: 5, data: Symbol('data5') }
      ]
      const docClient = createDocumentClient()
      docClient[baseMethod]
        .mockResolvedValueOnce({ Items: expectedItems.slice(0, 2), LastEvaluatedKey: true })
        .mockResolvedValueOnce({ Items: expectedItems.slice(2, 4), LastEvaluatedKey: true })
        .mockResolvedValueOnce({ Items: expectedItems.slice(4), LastEvaluatedKey: false })
      const actualItems = await docClient[aggregateMethod]()
      expect(actualItems).toEqual(expectedItems)
    })

    it(`whilst concatenating ${baseMethod} results, passes ExclusiveStartKey param`, async () => {
      const expectedKey = Symbol('🔑')
      const docClient = createDocumentClient()
      docClient[baseMethod].mockResolvedValueOnce({ Items: [], LastEvaluatedKey: expectedKey }).mockResolvedValueOnce({ Items: [] })
      await docClient[aggregateMethod]()
      expect(docClient[baseMethod]).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          ExclusiveStartKey: expectedKey
        })
      )
    })

    it("omits ExclusiveStartKey if previous LastEvaluatedKey isn't available", async () => {
      const docClient = createDocumentClient()
      await docClient[aggregateMethod]()
      expect(docClient[baseMethod]).toHaveBeenNthCalledWith(
        1,
        expect.not.objectContaining({
          ExclusiveStartKey: expect.anything()
        })
      )
    })
  })

  describe('batchWriteAllPromise', () => {
    it('is added to document client', () => {
      const docClient = createDocumentClient()
      expect(docClient.batchWriteAllPromise).toBeDefined()
    })

    it('passes arguments provided for batchWriteAllPromise to batchWrite', async () => {
      const params = { RequestItems: { TEST: [{ PutRequest: { Item: { id: 1, data: Symbol('data1') } } }] } }
      const docClient = createDocumentClient()
      await docClient.batchWriteAllPromise(params)
      expect(docClient.batchWrite).toHaveBeenCalledWith(params)
    })

    it('calls batchWrite repeatedly until UnprocessedItems is empty', async () => {
      const docClient = createDocumentClient()
      docClient.batchWrite
        .mockResolvedValueOnce({ UnprocessedItems: { key: true } })
        .mockResolvedValueOnce({ UnprocessedItems: { key: true } })
        .mockResolvedValueOnce({ UnprocessedItems: { key: true } })
        .mockResolvedValueOnce({ UnprocessedItems: {} })
      await docClient.batchWriteAllPromise({ RequestItems: { key: true } })
      expect(docClient.batchWrite).toHaveBeenCalledTimes(4)
    })

    it.each([
      [1, 500],
      [2, 750],
      [3, 1125],
      [4, 1687.5],
      [5, 2500],
      [6, 2500],
      [7, 2500],
      [8, 2500],
      [9, 2500],
      [10, 2500]
    ])('retries %i times with %i ms delay on final retry', async (retries, delay) => {
      const docClient = createDocumentClient()
      for (let i = 0; i < retries; i++) {
        docClient.batchWrite.mockResolvedValueOnce({ UnprocessedItems: { key: true } })
      }
      await docClient.batchWriteAllPromise({ RequestItems: { key: true } })
      expect(setTimeout).toHaveBeenNthCalledWith(retries, expect.any(Function), delay)
    })

    it('throws an error on the eleventh retry', async () => {
      const docClient = createDocumentClient()
      for (let i = 0; i < 11; i++) {
        docClient.batchWrite.mockResolvedValueOnce({ UnprocessedItems: { key: true } })
      }
      await expect(() => docClient.batchWriteAllPromise({ RequestItems: { key: true } })).rejects.toThrow()
    })

    it('adds unprocessed items to batchWrite request', async () => {
      const token = Symbol('token')
      const firstCallSymbol = Symbol('first call')
      const secondCallSymbol = Symbol('second call')
      const docClient = createDocumentClient()
      docClient.batchWrite.mockResolvedValueOnce({ UnprocessedItems: { secondCallSymbol } })
      await docClient.batchWriteAllPromise({ token, RequestItems: { firstCallSymbol } })
      expect(docClient.batchWrite).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          token,
          RequestItems: { secondCallSymbol }
        })
      )
    })
  })

  describe('createUpdateExpression', () => {
    it('is added to document client', () => {
      const docClient = createDocumentClient()
      expect(docClient.createUpdateExpression).toBeDefined()
    })

    it('returns an object with UpdateExpression, ExpressionAttributeNames and ExpressionAttributeValues', () => {
      const docClient = createDocumentClient()
      const actual = docClient.createUpdateExpression({ id: 1, data: Symbol('data1') })
      expect(actual).toEqual(
        expect.objectContaining({
          UpdateExpression: expect.any(String),
          ExpressionAttributeNames: expect.any(Object),
          ExpressionAttributeValues: expect.any(Object)
        })
      )
    })

    it('transforms object to an update expression, with provided attribute names and values', () => {
      const permission = {
        id: 'abc-123',
        name: 'ABCDE-123JJ-ABK12',
        type: 'ddd-111-ggg-888'
      }
      const transaction = {
        payload: permission,
        permissions: [permission],
        status: { id: 'finalised' },
        payment: {
          amount: 16.32,
          method: 'barter',
          source: 'credit',
          timestamp: '2025-04-09T11:53:17.854Z'
        }
      }
      const docClient = createDocumentClient()

      const actual = docClient.createUpdateExpression(transaction)

      expect(actual).toMatchSnapshot()
    })
  })
})
