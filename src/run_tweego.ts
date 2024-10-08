import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolve } from "node:path";
import { openSync, closeSync } from "fs";

import { loadConfig, TweenodeBuildConfig } from "./handle_config";

const tweenodeFolderPath = resolve(process.cwd(), './.tweenode/')
const tweegoBinariePath = resolve(tweenodeFolderPath, process.platform == 'win32' ? './tweego.exe' : './tweego')
const loadedConfig = await loadConfig()

import { verifyBinarie } from "./verify_tweego";

interface InstanceData {
  isRunning: boolean
  pid: number | undefined
  output: string | undefined
  errors: string | undefined | Error
  tweego: ChildProcessWithoutNullStreams | undefined,
  code?: string
}


export const tweenode = (setupOptions?: TweenodeBuildConfig) => {
  //const setupConfig = { ...loadedConfig.build, ...setupOptions }
  const instanceData: InstanceData = {
    isRunning: false,
    pid: undefined,
    output: undefined,
    errors: undefined,
    tweego: undefined
  }

  const instance = {
    ...instanceData,
    verifyBinarie,

    async process(buildOptions?: TweenodeBuildConfig) {
      const buildConfig = { ...loadedConfig.build, ...buildOptions }

      if (await verifyBinarie() == false) {
        throw new Error('Failed to start Tweego')
      }

      const args = getArgs(buildConfig)

      try {
        instanceData.tweego = spawn(tweegoBinariePath, args)
        instanceData.isRunning = true
        instanceData.pid = instanceData.tweego.pid

      } catch (error) {
        instanceData.isRunning = false
        this.kill()
        throw new Error(`Error while running Tweego: ${error}`)
      }

      const stdio = await processStdio(instanceData, this.kill)
      instanceData.output = stdio.output
      instanceData.errors = stdio.error

      if (instanceData.errors) {
        throw new Error(instanceData.errors.message)
      }

      if (buildConfig.output.mode == 'string') {
        if (!/^<!DOCTYPE\s+html>/.test(instanceData.output!)) {
          instanceData.isRunning = false
          throw new Error(instanceData.output!.split('\n')[0])
        }

        instanceData.isRunning = false
        instanceData.code = instanceData.output
        this.kill()
      } else {
        const isOutputLocked = getLock(resolve(process.cwd(), buildOptions?.output.fileName!))
        if (isOutputLocked) {
          this.kill()
        }

      }


    },
    kill() {
      if (instanceData.tweego !== undefined) {
        const success = instanceData.tweego.kill()

        if (success) {
          instanceData.isRunning = false
        } else {
          throw new Error('Failed to kill tweego process')
        }
      }
    }

  }
  return instance
}



const getLock = (filePath: string) => {
  try {
    const file = openSync(filePath, 'r+')
    closeSync(file)
    return false

  } catch (error: any) {
    if (error.code === 'EBUSY' || error.code === 'EACEES') {
      return true
    } else {
      throw new Error(`Error: ${error}`)
    }
  }

}

const processStdio = (instanceData: InstanceData, kill: Function): Promise<{ output: string | undefined, error: Error | undefined }> => {
  return new Promise((resolve, reject) => {

    instanceData.tweego!.stderr.on('error', (error) => {
      reject({ output: undefined, error: error })

    })

    instanceData.tweego!.stdout.on('data', (data) => {
      resolve({ output: data.toString(), error: undefined })

    })

    instanceData.tweego!.stderr.on('data', (data => {
      resolve({ output: data.toString(), error: undefined })

    }))


    instanceData.tweego!.on('spawn', () => {
      instanceData.isRunning = true

    })

    instanceData.tweego!.on('exit', (code, signal) => {
      console.log(code, signal)
      kill()
    })

  })
}

const getArgs = (buildConfig: TweenodeBuildConfig) => {
  let args: string[] = []

  args.push(buildConfig.input.storyDir)

  buildConfig.output.mode == 'file' ? args.push(`--output=${buildConfig.output.fileName}`) : null

  buildConfig.input.head ? args.push(`--head=${buildConfig.input.head}`) : null

  buildConfig.input.modules ? args.push(`--module=${buildConfig.input.modules}`) : null

  buildConfig.input.additionalFlags ? args.push(...buildConfig.input.additionalFlags) : null

  buildConfig.input.forceDebug ? args.push('-t') : null

  return args
}
