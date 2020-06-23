import { createFtpWriteStream } from '../ftp.js'
import { mockedFtpMethods } from 'ssh2-sftp-client'

jest.mock('stream')
jest.mock('../../config.js', () => ({
  ftp: {
    host: 'testhost',
    port: 2222,
    path: 'testpath/',
    username: 'testusername',
    privateKey: 'testprivatekey'
  }
}))

describe('ftp', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createFtpWriteStream', () => {
    it('creates a stream to write to the configured FTP server', async () => {
      const { ftpWriteStream, managedUpload } = createFtpWriteStream('testfile.json')
      ftpWriteStream.write('Some data')
      ftpWriteStream.end()
      await managedUpload
      expect(mockedFtpMethods.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'testhost',
          port: 2222,
          username: 'testusername',
          privateKey: 'testprivatekey'
        })
      )
      expect(mockedFtpMethods.put).toHaveBeenCalledWith(ftpWriteStream, 'testpath/testfile.json', {
        flags: 'w',
        encoding: 'UTF-8',
        autoClose: false
      })
      expect(mockedFtpMethods.end).toHaveBeenCalled()
    })

    it('rejects the managed upload promise if an FTP upload error occurs', async () => {
      const testError = new Error('Test error')
      mockedFtpMethods.put.mockImplementationOnce(() => Promise.reject(testError))
      const { ftpWriteStream, managedUpload } = createFtpWriteStream('testfile.json')
      await expect(managedUpload).rejects.toThrow('Test error')
      expect(mockedFtpMethods.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'testhost',
          port: 2222,
          username: 'testusername',
          privateKey: 'testprivatekey'
        })
      )
      expect(mockedFtpMethods.put).toHaveBeenCalledWith(ftpWriteStream, 'testpath/testfile.json', {
        flags: 'w',
        encoding: 'UTF-8',
        autoClose: false
      })
      expect(mockedFtpMethods.end).toHaveBeenCalled()
    })
  })
})
