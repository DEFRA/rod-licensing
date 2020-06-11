/**
 * Key exchange algorithms for public key authentication - in descending order of priority
 * @type {string[]}
 */
export const SFTP_KEY_EXCHANGE_ALGORITHMS = [
  'curve25519-sha256@libssh.org',
  'curve25519-sha256',
  'ecdh-sha2-nistp521',
  'ecdh-sha2-nistp384',
  'ecdh-sha2-nistp256',
  'diffie-hellman-group-exchange-sha256',
  'diffie-hellman-group14-sha256',
  'diffie-hellman-group16-sha512',
  'diffie-hellman-group18-sha512',
  'diffie-hellman-group14-sha1',
  'diffie-hellman-group-exchange-sha1',
  'diffie-hellman-group1-sha1'
]
/**
 * Ciphers for SFTP support - in descending order of priority
 * @type {string[]}
 */
export const SFTP_CIPHERS = [
  // http://tools.ietf.org/html/rfc4344#section-4
  'aes256-ctr',
  'aes192-ctr',
  'aes128-ctr',
  'aes256-gcm',
  'aes256-gcm@openssh.com',
  'aes128-gcm',
  'aes128-gcm@openssh.com',
  'aes256-cbc',
  'aes192-cbc',
  'aes128-cbc',
  'blowfish-cbc',
  '3des-cbc',
  'cast128-cbc'
]
