import { CacheError } from '../cache-manager.js'
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

  it.each([
    { context: { state: { sid: null } }, sessionCookieName: 'sid', description: 'session cookie is null' },
    { context: { state: { scn: undefined } }, sessionCookieName: 'scn', description: 'session cookie is undefined' },
    { context: { state: {} }, sessionCookieName: 'garibaldi', description: "session cookie doesn't exist" },
    { context: { state: null }, sessionCookieName: 'chocolate-chip', description: 'state is null' },
    { context: { state: undefined }, sessionCookieName: 'hobnob', description: 'state is undefined' }
  ])('getting id throws cache error if $description', ({ context, sessionCookieName }) => {
    const cacheDecorator = generateCacheDecorator(getCacheDecoratorContext(context), sessionCookieName)
    const error = (() => {
      try {
        cacheDecorator.getId()
      } catch (e) {
        return e
      }
    })()

    expect(error instanceof CacheError).toBeTruthy()
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

const generateCacheDecorator = (context, sessionCookieName = Object.keys(context.state)[0]) => {
  return cacheDecorator(sessionCookieName).call(context)
}
