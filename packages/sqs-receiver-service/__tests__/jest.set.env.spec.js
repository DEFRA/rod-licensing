test('Set environment for tests', () => {
  const test = () => {
    require('../jest.set-env')
  }
  expect(() => test()).not.toThrow()
})
