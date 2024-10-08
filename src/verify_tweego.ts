import { resolve } from "node:path"
import { spawn } from "node:child_process";

import { loadConfig } from "./handle_config"
const loadedConfig = await loadConfig()

const tweenodeFolderPath = resolve(process.cwd(), './.tweenode/')
const tweegoBinariePath = resolve(tweenodeFolderPath, process.platform == 'win32' ? './tweego.exe' : './tweego')

export const verifyBinarie = () => {
  const tweego = spawn(tweegoBinariePath, ['--version'])
  return new Promise((resolve, reject) => {
    let worked = false
    tweego.stderr.on('data', (output) => {
      if (output.toString().includes(`tweego, version ${loadedConfig.setup.tweegoBinaries!.version}`)) {
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