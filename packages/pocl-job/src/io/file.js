import Path from 'path'
import fs from 'fs'

export function getTempDir (...additionalPaths) {
  const tempDir = Path.resolve(process.env.POCL_TEMP_PATH, ...additionalPaths)
  fs.mkdirSync(tempDir, { recursive: true })
  return tempDir
}

export function mkdirp (path) {
  fs.mkdirSync(path, { recursive: true })
}
