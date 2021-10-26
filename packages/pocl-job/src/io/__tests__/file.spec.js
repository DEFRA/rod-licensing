import { mkdtempSync, mkdirSync, rmdirSync } from 'fs'
import mockPath from 'path'
import os from 'os'
import * as file from '../file.js'

jest.mock('fs', () => ({
  mkdtempSync: jest.fn(prefix => mockPath.join(`${prefix}${String(Math.random()).slice(-6)}`)),
  mkdirSync: jest.fn(val => val),
  rmdirSync: jest.fn()
}))

describe('file operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    file.reset()
  })

  describe('getTempDir', () => {
    it('ensures a temp dir exists at the configured path', async () => {
      const result = file.getTempDir()
      expect(mkdtempSync).toHaveBeenCalledWith(`${os.tmpdir()}${mockPath.sep}pocl-`)
      expect(result).toMatch(/\/(?:\w+\/)+pocl-\w{6}/)
      expect(mkdirSync).not.toHaveBeenCalled()
    })

    it('returns the same temp dir for successive invocations', async () => {
      const actualTmp1 = file.getTempDir()
      const actualTmp2 = file.getTempDir()
      expect(actualTmp1).toStrictEqual(actualTmp2)
      expect(mkdtempSync).toHaveBeenCalledTimes(1)
      expect(mkdirSync).not.toHaveBeenCalled()
    })

    it('ensures a temp dir exists at the configured path with additional path options', async () => {
      const file = require('../file.js')
      const result = file.getTempDir('path', 'to', 'subfolder')
      const expectedPathRegex = /(?:\w+\/)+pocl-\w{6}\/path\/to\/subfolder/
      expect(result).toMatch(expectedPathRegex)
      expect(mkdirSync).toHaveBeenCalledWith(expect.stringMatching(expectedPathRegex), { recursive: true })
    })
  })

  describe('removeTemp', () => {
    it('removes the temporary directory recursively', async () => {
      const file = require('../file.js')
      const tmpDir = file.getTempDir()
      file.removeTemp()
      expect(rmdirSync).toHaveBeenCalledWith(tmpDir, { recursive: true })
    })
  })
})
