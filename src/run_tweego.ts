import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { resolve } from 'node:path'
import { appendFileSync } from 'node:fs'
import { outputFile, removeSync } from 'fs-extra/esm'

import { verifyBinarie } from './verify_tweego'
import { getTweenodeFolderPath } from './download_tweego'
import { deepmerge } from 'deepmerge-ts'

export interface TweenodeBuildConfig {
  output: {
    /**
     * When using `'string'` output, you can pass the compiled story to a variable
     * @example
     *
     * const tweego = new Tweenode()
     *
     * const result = await tweego.process({
     *  build: {
     *      input: {...}
     *      output: {
     *        mode: 'string'
     *     }
     *   }
     * })
     *
     * console.log(result) // Will print out the compiled story HTML
     */
    mode: 'file' | 'string'
    fileName?: string
  }
  input: {
    /**
     * Path to where your .twee files are
     */
    storyDir: string
    /**
     * Path to html file to be included in the head of the compiled story
     * @deprecated use `htmlHead`
     */
    head?: string
    /**
     * Path to html file to be included in the head of the compiled story
     */
    htmlHead?: string
    /**
     * Path to supported files for Tweego to bundle, see supported on Tweego docs
     * @see https://www.motoslave.net/tweego/docs/#usage-options
     */
    modules?: string[]
    /**
     * Path to your stylesheet file or directory
     */
    styles?: string
    /**
     * Path to your script file or directory
     */
    scripts?: string
    /**
     * Use Twine test mode, some formats offer debug tools
     * @deprecated Use `useTwineTestMode`
     */
    forceDebug?: boolean
    /**
     * Use Twine test mode, some formats offer debug tools
     */
    useTwineTestMode?: boolean
    /**
     * Array of aditional flags, like `--no-trim`
     * @see https://www.motoslave.net/tweego/docs/#usage-options
     */
    additionalFlags?: string[]
  }
}

export interface TweenodeDebugConfig {
  writeToLog?: boolean
  detachProcess?: boolean
}

export interface TweenodeOptions {
  debug?: TweenodeDebugConfig
  build: TweenodeBuildConfig
}

const defaultOptions = {
  debug: {
    writeToLog: false,
    detachProcess: false,
  },
  build: {
    output: {
      mode: 'string',
    },
    input: {
      storyDir: '',
    },
  },
} as const

class Tweenode {
  buildConfig: TweenodeBuildConfig
  debugConfig: TweenodeDebugConfig
  childProcess: ChildProcessWithoutNullStreams | undefined
  isRunning: boolean
  private stdio: undefined | ProcessStdioReturn
  tweegoBinariePath: string

  constructor(options: TweenodeOptions) {
    this.buildConfig = options.build
    this.debugConfig = options.debug ? options.debug : defaultOptions.debug
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

export const tweenode = async (options: TweenodeOptions) => {
  const config = deepmerge(defaultOptions, options) as TweenodeOptions
  return new Tweenode(config)
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

    instance.childProcess!.on('exit', (_code, _signal) => {
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
