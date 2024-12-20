import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { resolve } from 'node:path'
import { appendFileSync } from 'node:fs'
import { outputFile, removeSync } from 'fs-extra/esm'
import type { TweenodeBuildConfig, TweenodeDebugConfig } from './handle_config'

import { config as loadedConfig } from './state'

import { verifyBinarie } from './verify_tweego'
import { getTweenodeFolderPath } from './download_tweego'

export class Tweenode {
  buildConfig: TweenodeBuildConfig
  debugConfig: TweenodeDebugConfig
  childProcess: ChildProcessWithoutNullStreams | undefined
  isRunning: boolean
  private stdio: undefined | ProcessStdioReturn
  tweegoBinariePath: string

  constructor(debugOptions?: TweenodeDebugConfig) {
    this.buildConfig = { ...loadedConfig.build! }
    this.debugConfig = { ...loadedConfig.debug!, ...debugOptions }
    this.childProcess = undefined
    this.isRunning = false
    this.stdio = undefined
    this.tweegoBinariePath = resolve(
      getTweenodeFolderPath(),
      process.platform == 'win32' ? './tweego.exe' : './tweego'
    )

    removeSync(resolve(getTweenodeFolderPath(), 'tweenode.log'))
  }

  async process(buildOptions?: TweenodeBuildConfig) {
    this.buildConfig = { ...this.buildConfig, ...buildOptions }

    if ((await verifyBinarie()) == false) {
      this.errorHandler('Failed to start Tweego')
    }

    const args = getArgs(this.buildConfig)

    try {
      this.childProcess = spawn(this.tweegoBinariePath, args, {
        detached: this.debugConfig.detachProcess,
        stdio: 'pipe',
        env: {
          ...process.env,
          TWEEGO_PATH: resolve(getTweenodeFolderPath(), 'storyformats'),
        },
      })
      this.isRunning = true
    } catch (error) {
      this.isRunning = false
      this.errorHandler(`Error while running Tweego: ${error}`)
      this.kill()
    }

    try {
      this.stdio = await processStdio(this)
    } catch (error) {
      this.errorHandler(`Output processing error: ${error}`)
    }

    if (this.stdio !== undefined) {
      if (this.stdio.error) {
        this.errorHandler(`Tweego error: ${this.stdio.error}`)
      }

      if (!/^<!DOCTYPE\s+html>/.test(this.stdio.output!)) {
        this.errorHandler(this.stdio.output!)
        this.kill()
      }

      if (!this.stdio.output!.includes('</body>')) {
        this.errorHandler(this.stdio.output!)
        this.kill()
      }

      if (this.buildConfig.output.mode == 'string') {
        this.isRunning = false
        return this.stdio.output
      } else {
        await outputFile(
          this.buildConfig.output!.fileName!,
          this.stdio!.output!,
          { encoding: 'utf8' }
        )
      }
    }
  }
  private errorHandler(error: string) {
    const errorTolog = `[${formattedTime()}]\n${error}\n\n`

    if (this.debugConfig.writeToLog) {
      appendFileSync(
        resolve(getTweenodeFolderPath(), 'tweenode.log'),
        errorTolog,
        'utf-8'
      )
    }

    if (error.split('\n').length > 10) {
      throw new Error(error.split('\n')[0])
    } else {
      throw new Error(error)
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
              this.errorHandler('Failed to kill tweego process')
            }
          }
        }, 1500)
      }
    }
  }
}

const formattedTime = () => {
  const date = new Date()

  const formated = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)

  return formated
}

interface ProcessStdioReturn {
  output: string | undefined
  error: Error | undefined | string
}

const processStdio = (
  instance: InstanceType<typeof Tweenode>
): Promise<ProcessStdioReturn> => {
  let output = ''
  let error = ''

  return new Promise((resolve, reject) => {
    instance.childProcess!.stderr.on('error', stdError => {
      error += stdError
    })

    instance.childProcess!.stdout.on('data', stdOutput => {
      output += stdOutput.toString()
    })

    instance.childProcess!.stderr.on('data', stdOutput => {
      output += stdOutput.toString()
    })

    instance.childProcess!.on('spawn', () => {
      instance.isRunning = true
    })

    instance.childProcess!.on('exit', (code, signal) => {
      if (error.length > 0) {
        reject({ output: output, error: error })
      } else {
        resolve({ output: output, error: error })
      }

      if (instance.childProcess!.exitCode !== 0) {
        instance.kill()
      }
    })
  })
}

const getArgs = (buildConfig: TweenodeBuildConfig) => {
  let args: string[] = []

  args.push(buildConfig.input.storyDir)

  buildConfig.input.htmlHead
    ? args.push(`--head=${buildConfig.input.htmlHead}`)
    : null

  if (buildConfig.input.modules) {
    buildConfig.input.modules.forEach(module => {
      args.push(`--module=${module}`)
    })
  }

  buildConfig.input.styles
    ? args.push(`--module=${buildConfig.input.styles}`)
    : null

  buildConfig.input.scripts ? args.push(buildConfig.input.scripts) : null

  buildConfig.input.additionalFlags
    ? args.push(...buildConfig.input.additionalFlags)
    : null

  buildConfig.input.useTwineTestMode ? args.push('-t') : null

  return args
}
