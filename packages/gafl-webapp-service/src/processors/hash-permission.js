import crypto from 'crypto'

const hashOperand = ({ hash: _hash, permit: _permit, licensee: _licensee, ...p }) => p

export default permission => {
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(hashOperand(permission)))
  return hash.digest('hex')
}
