import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { loadConfig } from './handle_config'
import { getTweenodeFolderPath } from './download_tweego'
const loadedConfig = await loadConfig()
import { chmodSync } from 'node:fs'

export const verifyBinarie = () => {
  const tweegoBinariePath = resolve(
    getTweenodeFolderPath(),
    process.platform == 'win32' ? './tweego.exe' : './tweego'
  )

  if (process.platform == 'linux' || process.platform == 'darwin') {
    chmodSync(tweegoBinariePath, 0o755)
  }

  const tweego = spawn(tweegoBinariePath, ['--version'])
  return new Promise((resolve, reject) => {
    let worked = false
    tweego.stderr.on('data', output => {
      if (
        output
          .toString()
          .includes(
            `tweego, version ${loadedConfig.setup.tweegoBinaries!.version}`
          )
      ) {
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
