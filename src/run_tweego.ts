import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { resolve } from 'node:path'
import { outputFile } from 'fs-extra'
import {
  loadConfig,
  TweenodeBuildConfig,
  TweenodeSetupConfig,
} from './handle_config'

const loadedConfig = await loadConfig()

import { verifyBinarie } from './verify_tweego'
import { getTweenodeFolderPath } from './download_tweego'

export class Tweenode {
  setupConfig: TweenodeSetupConfig
  buildConfig: TweenodeBuildConfig
  childProcess: ChildProcessWithoutNullStreams | undefined
  isRunning: boolean
  private stdio: undefined | ProcessStdioReturn
  tweegoBinariePath: string

  constructor(setupOptions?: TweenodeSetupConfig) {
    this.setupConfig = { ...loadedConfig.setup, ...setupOptions }
    this.buildConfig = { ...loadedConfig.build }
    this.childProcess = undefined
    this.isRunning = false
    this.stdio = undefined
    this.tweegoBinariePath = resolve(
      getTweenodeFolderPath(),
      process.platform == 'win32' ? './tweego.exe' : './tweego'
    )
  }

  async process(buildOptions?: TweenodeBuildConfig) {
    this.buildConfig = { ...this.buildConfig, ...buildOptions }

    if ((await verifyBinarie()) == false) {
      throw new Error('Failed to start Tweego')
    }

    const args = getArgs(this.buildConfig)

    try {
      this.childProcess = spawn(this.tweegoBinariePath, args, {
        detached: true,
        env: {
          ...process.env,
          TWEEGO_PATH: resolve(getTweenodeFolderPath(), 'storyformats'),
        },
      })
      this.isRunning = true
    } catch (error) {
      this.isRunning = false
      this.kill()
      throw new Error(`Error while running Tweego: ${error}`)
    }

    this.stdio = await processStdio(this)
    if (this.stdio !== undefined) {
      if (this.stdio.error) {
        throw new Error(`Tweego error: ${this.stdio.error}`)
      }

      if (this.buildConfig.output.mode == 'string') {
        if (!/^<!DOCTYPE\s+html>/.test(this.stdio.output!)) {
          this.kill()
          throw new Error(this.stdio.output!.split('\n')[0])
        }

        this.isRunning = false
        return this.stdio.output
      } else {
        if (!/^<!DOCTYPE\s+html>/.test(this.stdio.output!)) {
          this.kill()
          throw new Error(this.stdio.output!.split('\n')[0])
        }

        await outputFile(
          this.buildConfig.output!.fileName!,
          this.stdio!.output!
        )
      }
    }
  }

  kill() {
    if (this.childProcess !== undefined) {
      let success = this.childProcess.kill()

      if (success) {
        this.isRunning = false
      } else {
        setTimeout(() => {
          if (this.childProcess!.killed == false) {
            success = this.childProcess!.kill('SIGKILL')
            if (success) {
              this.isRunning = false
            } else {
              throw new Error('Failed to kill tweego process')
            }
          }
        }, 1500)
      }
    }
  }
}

// const getLock = (filePath: string) => {
//   try {
//     const file = openSync(filePath, 'r+')
//     closeSync(file)
//     return false
//   } catch (error: any) {
//     if (error.code === 'EBUSY' || error.code === 'EACEES') {
//       return true
//     } else {
//       throw new Error(`Error: ${error}`)
//     }
//   }
// }

interface ProcessStdioReturn {
  output: string | undefined
  error: Error | undefined
}

const processStdio = (
  instance: InstanceType<typeof Tweenode>
): Promise<ProcessStdioReturn> => {
  return new Promise((resolve, reject) => {
    instance.childProcess!.stderr.on('error', error => {
      reject({ output: undefined, error: error })
    })

    instance.childProcess!.stdout.on('data', data => {
      resolve({ output: data.toString(), error: undefined })
    })

    instance.childProcess!.stderr.on('data', data => {
      resolve({ output: data.toString(), error: undefined })
    })

    instance.childProcess!.on('spawn', () => {
      instance.isRunning = true
    })

    instance.childProcess!.on('exit', (code, signal) => {
      if (instance.childProcess!.exitCode !== 0) {
        instance.kill()
      }
    })
  })
}

const getArgs = (buildConfig: TweenodeBuildConfig) => {
  let args: string[] = []

  args.push(buildConfig.input.storyDir)

  buildConfig.input.head ? args.push(`--head=${buildConfig.input.head}`) : null

  buildConfig.input.modules
    ? args.push(`--module=${buildConfig.input.modules}`)
    : null

  buildConfig.input.additionalFlags
    ? args.push(...buildConfig.input.additionalFlags)
    : null

  buildConfig.input.forceDebug ? args.push('-t') : null

  return args
}
