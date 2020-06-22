import Path from 'path'
import fs from 'fs'
import os from 'os'
let processTemp = null
export function getTempDir (...subfolders) {
  if (!processTemp) {
    processTemp = Path.resolve(fs.mkdtempSync(`${os.tmpdir()}${Path.sep}pocl-`))
  }
  let tmpDir = processTemp
  if (subfolders.length) {
    tmpDir = Path.resolve(processTemp, ...subfolders)
    fs.mkdirSync(tmpDir, { recursive: true })
  }
  return tmpDir
}

export function removeTemp () {
  if (processTemp) {
    fs.rmdirSync(processTemp, { recursive: true })
  }
}
