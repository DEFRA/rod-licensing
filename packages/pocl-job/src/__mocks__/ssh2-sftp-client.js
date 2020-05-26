const ssh2sftpClient = jest.genMockFromModule('ssh2-sftp-client')

export const mockedMethods = {
  connect: jest.fn(),
  list: jest.fn(),
  fastGet: jest.fn(),
  delete: jest.fn(),
  end: jest.fn()
}
ssh2sftpClient.mockImplementation(() => mockedMethods)
export default ssh2sftpClient
