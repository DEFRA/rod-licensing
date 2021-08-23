import { configureAwsSdkMock } from '@defra-fish/connectors-lib/src/__mocks__/aws-mock-helper.js'
const AwsSdk = configureAwsSdkMock(jest.genMockFromModule('aws-sdk'))
export default AwsSdk
