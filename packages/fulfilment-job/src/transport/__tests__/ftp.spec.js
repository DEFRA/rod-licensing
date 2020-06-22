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
      const ftpWriteStream = await createFtpWriteStream('testfile.json')
      ftpWriteStream.write('Some data')
      ftpWriteStream.end()
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
      // Allow some time for the sftp promise to resolve itself
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(mockedFtpMethods.end).toHaveBeenCalled()
    })

    it('emits an error to the stream if an FTP upload error occurs', async () => {
      const testError = new Error('Test error')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      mockedFtpMethods.put.mockImplementationOnce(() => Promise.reject(testError))
      const ftpWriteStream = await createFtpWriteStream('testfile.json')
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
      // Allow some time for the sftp promise to resolve itself
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(ftpWriteStream.emit).toHaveBeenCalledWith('error', testError)
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(mockedFtpMethods.end).toHaveBeenCalled()
    })
  })
})
