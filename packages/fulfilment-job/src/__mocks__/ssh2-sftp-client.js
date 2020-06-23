const ssh2sftpClient = jest.genMockFromModule('ssh2-sftp-client')

export const mockedFtpMethods = {
  connect: jest.fn(async () => {}),
  put: jest.fn(async () => {}),
  end: jest.fn()
}
ssh2sftpClient.mockImplementation(() => mockedFtpMethods)
export default ssh2sftpClient
