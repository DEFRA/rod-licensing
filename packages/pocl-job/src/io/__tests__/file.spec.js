import * as file from '../file.js'
import { mkdirSync } from 'fs'

jest.mock('fs')

describe('file operations', () => {
  beforeAll(() => {
    process.env.POCL_TEMP_PATH = '/tmp'
  })
  beforeEach(jest.clearAllMocks)
  describe('getTempDir', () => {
    it('ensures a temp dir exists at the configured path', async () => {
      file.getTempDir()
      expect(mkdirSync).toHaveBeenCalledWith('/tmp', { recursive: true })
    })
    it('ensures a temp dir exists at the configured path with additional path options', async () => {
      file.getTempDir('path', 'to', 'subfolder')
      expect(mkdirSync).toHaveBeenCalledWith('/tmp/path/to/subfolder', { recursive: true })
    })
  })

  describe('mkdirp', () => {
    it('ensures a dir exists at the specified path', async () => {
      file.mkdirp('/path/to/whatever')
      expect(mkdirSync).toHaveBeenCalledWith('/path/to/whatever', { recursive: true })
    })
  })
})
