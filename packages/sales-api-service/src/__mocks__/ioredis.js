const ioredis = jest.genMockFromModule('ioredis')
const keys = {}
ioredis.prototype.incr.mockImplementation(
  jest.fn(async id => {
    keys[id] = ++keys[id] || 0
    return String(keys[id])
  })
)
export default ioredis
