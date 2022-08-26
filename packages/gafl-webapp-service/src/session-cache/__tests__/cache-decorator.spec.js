import { cacheDecorator } from '../cache-decorator.js'

describe('Cache decorator', () => {
  it('gets id from state', () => {
    const sessionId = 'abc123'
    const sessionCookieName = 'custardCream'
    const context = getCacheDecoratorContext({
      state: { [sessionCookieName]: { id: sessionId } }
    })

    expect(generateCacheDecorator(context).getId()).toBe(sessionId)
  })

  // it.each([
  //   [{ state: {} }, false],
  //   [{ state: { bourbon: { id: 'abc123' } } }, true]
  // ])('hasSession flags whether cache is available', (state, expectedHasSession) => {
  //   const context = getCacheDecoratorContext(state)

  //   expect(generateCacheDecorator(context).hasSession()).toEqual(expectedHasSession)
  // })
})

const getCacheDecoratorContext = context => ({
  state: {
    sid: {
      id: 'session-id'
    }
  },
  server: {
    app: {}
  },
  ...context
})

const generateCacheDecorator = context => {
  const sessionCookieName = Object.keys(context.state)[0]
  return cacheDecorator(sessionCookieName).call(context)
}
