import Path from 'path'
jest.mock('path')
const realPath = jest.requireActual('path')

describe('project', () => {
  beforeEach(jest.clearAllMocks)

  it('provides root export', () => {
    jest.isolateModules(() => {
      const rootPath = Symbol('rootPath')
      Path.join.mockReturnValueOnce(rootPath)
      const prj = require('../project.cjs')
      expect(prj.root).toBe(rootPath)
    })
  })

  it('recurses from __dirname', () => {
    jest.isolateModules(() => {
      const expectedDirName = jest.requireActual('path').join(__dirname, '..')
      require('../project.cjs')
      expect(Path.join).toHaveBeenCalledWith(expectedDirName, '..')
    })
  })

  it('provides package json path', () => {
    jest.isolateModules(() => {
      const mockModule = {
        name: 'mocked-package',
        version: '1.0.0'
      }
      jest.mock(`${realPath.join(__dirname, '../..')}/package.json`, () => mockModule)
      console.log('Path', Path)
      Path.join.mockReturnValueOnce(null).mockReturnValueOnce(`${realPath.join(__dirname, '../..')}/package.json`)
      const { packageJson } = require('../project.cjs')
      expect(packageJson).toBe(mockModule)
    })
  })
})
