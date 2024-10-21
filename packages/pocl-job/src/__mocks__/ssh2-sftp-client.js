const ssh2sftpClient = jest.genMockFromModule('ssh2-sftp-client')

export const mockedFtpMethods = {
  connect: jest.fn(),
  list: jest.fn(),
  fastGet: jest.fn(),
  delete: jest.fn(),
  end: jest.fn()
}
ssh2sftpClient.mockImplementation(() => mockedFtpMethods)

export default ssh2sftpClient
