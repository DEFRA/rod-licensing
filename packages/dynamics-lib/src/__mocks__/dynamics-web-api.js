import { configureDynamicsWebApiMock } from './dynamics-web-api-mock-helper.js'
const DynamicsWebApi = jest.fn()
DynamicsWebApi.prototype = {}
configureDynamicsWebApiMock(DynamicsWebApi)
export { DynamicsWebApi }
