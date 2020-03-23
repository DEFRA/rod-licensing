'use strict'

import { start, stop, server, getCookies } from '../../misc/test-utils.js'
import helper from '../transaction-helper.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

const nu = async cookie =>
  server.inject({
    method: 'GET',
    url: '/buy/new',
    headers: cookie ? { cookie: 'sid=' + cookie.sid } : {}
  })

const add = async cookie =>
  server.inject({
    method: 'GET',
    url: '/buy/add',
    headers: cookie ? { cookie: 'sid=' + cookie.sid } : {}
  })

describe('The transaction helper', () => {
  it('hasPermission return where there is no permission set', async () => {
    const data = await nu()
    const cookie = getCookies(data)

    server.route({
      method: 'GET',
      path: '/has-permission',
      handler: async request => {
        return helper.hasPermission(request)
      }
    })

    const { payload } = await server.inject({
      method: 'GET',
      url: '/has-permission',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(payload)).toBeFalsy()
  })

  it('Gets and sets the current permission object', async () => {
    const data = await add()
    const cookie = getCookies(data)

    server.route({
      method: 'GET',
      path: '/get-permission',
      handler: async request => {
        await helper.setPermission(request, { foo: 'bar' })
        return helper.getPermission(request)
      }
    })

    const { payload } = await server.inject({
      method: 'GET',
      url: '/get-permission',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(payload)).toEqual({ foo: 'bar' })
  })

  it('Gets and sets an arbitrary permission object', async () => {
    const data = await add()
    const cookie = getCookies(data)
    await add(cookie)
    await add(cookie)

    const { payload } = await server.inject({
      method: 'GET',
      url: '/get-permission',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(payload)).toEqual({ foo: 'bar' })
  })
})
