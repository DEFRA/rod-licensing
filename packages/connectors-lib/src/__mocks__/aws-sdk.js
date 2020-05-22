import { configureAwsSdkMock } from './aws-mock-helper.js'
const AwsSdk = configureAwsSdkMock(jest.genMockFromModule('aws-sdk'))
export default AwsSdk
