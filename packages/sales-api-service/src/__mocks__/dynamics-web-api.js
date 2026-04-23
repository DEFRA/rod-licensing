import { configureDynamicsWebApiMock } from '../../../dynamics-lib/src/__mocks__/dynamics-web-api-mock-helper.js'
const DynamicsWebApi = jest.fn()
DynamicsWebApi.prototype = {}
configureDynamicsWebApiMock(DynamicsWebApi)
export { DynamicsWebApi }
