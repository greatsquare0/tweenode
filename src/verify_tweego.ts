import { resolve } from 'node:path'
import { chmodSync } from 'node:fs'
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process'

import { getTweenodeFolderPath } from './download_tweego'

export const verifyBinarie = () => {
  const tweegoBinariePath = resolve(
    getTweenodeFolderPath(),
    process.platform == 'win32' ? './tweego.exe' : './tweego'
  )

  if (process.platform == 'linux' || process.platform == 'darwin') {
    chmodSync(tweegoBinariePath, 0o755)
  }

  let tweego: ChildProcessWithoutNullStreams

  try {
    tweego = spawn(tweegoBinariePath, ['--version'])
  } catch (error) {
    throw new Error(`Failed to start Tweego: ${error}`)
  }

  return new Promise((resolve, reject) => {
    let worked = false
    tweego.stderr.on('data', output => {
      if (output.toString().includes(`Tweego (a Twee compiler in Go)`)) {
        worked = true
      } else {
        worked = false
      }
    })

    tweego.on('exit', () => {
      worked ? resolve(true) : reject(false)
    })
  })
}
