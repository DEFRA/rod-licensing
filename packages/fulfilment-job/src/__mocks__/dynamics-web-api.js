import { configureDynamicsWebApiMock } from '../../../dynamics-lib/src/__mocks__/dynamics-web-api-mock-helper.js'
const DynamicsWebApi = jest.genMockFromModule('dynamics-web-api')
export default configureDynamicsWebApiMock(DynamicsWebApi)
