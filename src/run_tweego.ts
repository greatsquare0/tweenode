import { spawnSync } from "node:child_process";
import { existsSync, accessSync, constants } from "node:fs";


const projectRoot = process.cwd()
const tweeno_folder = `${projectRoot}/.tweeno`

const verifyTweego = () => {
  const tweegoExec = `${tweeno_folder}/tweego${process.platform == 'win32' ? '.exe' : null}`
  if (!existsSync(tweegoExec)) throw new Error('Tweego exec not found')

  if (['linux', 'darwin'].includes(process.platform)) {
    try {
      accessSync(tweegoExec, constants.X_OK)
    } catch (err) {
      throw new Error(`${tweegoExec} does not have permissions to execute.
        Run the following command to ensure tweego is executable:
        \t chmod +x ${tweegoExec}
        `)
    }
  }

  const result = spawnSync(tweegoExec, ['--version'])
  if (!result.stderr.toString().includes('Tweego (a Twee compiler in Go)')) {
    throw new Error(`Failed to run tweego:\n ${result.stderr.toString()}`)
  }

  return tweegoExec
}

export interface TweegoOptions {
  head?: string
  module?: string
  scripts?: string
  input: string
  output: string
  forceDebug?: boolean
  additionalOptions?: string[]
}

const runTweego = (options: TweegoOptions) => {
  const exec = verifyTweego()

  const optionsArray = [
    `--output=${options.output}`
  ]

  options.head ? optionsArray.push(`--head=${options.head}`) : null;
  options.module ? optionsArray.push(`--module=${options.module}`) : null;
  options.forceDebug ? optionsArray.push('-t') : null;

  optionsArray.push(options.input)

  options.scripts ? optionsArray.push(options.scripts) : null;

  let result
  try {
    result = spawnSync(exec, optionsArray, {
      stdio: 'pipe'
    })

    const output = result.stdout ? result.stdout.toString() : '';
    const errors = result.stderr ? result.stderr.toString() : '';

    if (result.signal) {
      console.warn(`Tweego stoped by signal: ${result.signal}`)

    } else if (result.status !== 0) {

      throw new Error(`Failed with error code: ${result.status} \n ${errors || output}`)
    }

  } catch (error) {
    throw new Error(`Failed to start story build: ${error}`)
  }

  return result
}

export {
  runTweego
}