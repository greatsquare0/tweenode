import { existsSync, readFileSync } from "fs";
import { resolve } from "node:path";

interface StoryFormat {
  name: string
  version: string,
  src: string
}

export interface TweenodeConfiguration {
  build: {
    output: {
      mode: 'file' | 'string'
      fileName?: string
    },
    input: {
      storyDir: string
      head?: string
      modules?: string
      forceDebug?: boolean
      additionalFlags?: string[]
    }
  }
  tweegoBinaries?: {
    version: string,
    acceptablePlataforms: string[] | ['win32', 'darwin', 'linux']
    acceptableArch: string[] | ['x86', 'x64']
  },
  storyFormats?: {
    useTweegoBuiltin: boolean,
    formats?: StoryFormat[]
  }
}

let cache: TweenodeConfiguration

export const loadConfig = async (customPath?: string): Promise<TweenodeConfiguration> => {

  if (cache) {
    return cache
  }
  let configPath = ''

  if (customPath) {
    configPath = resolve(process.cwd(), customPath)
    console.log(configPath)
  } else {
    const tsPath = resolve(process.cwd(), 'tweenode.config.js')
    const jsPath = resolve(process.cwd(), 'tweenode.config.ts')

    if (existsSync(jsPath)) {
      configPath = jsPath
    } else if (existsSync(tsPath)) {
      configPath = tsPath
    }
  }

  if (!existsSync(configPath)) {
    return defaultConfig as TweenodeConfiguration
  }

  const config = await import(configPath)

  cache = config
  return config

}

export const defaultConfig: Partial<TweenodeConfiguration> = {
  build: {
    output: {
      mode: 'string'
    },
    input: {
      storyDir: ''
    }
  },
  tweegoBinaries: {
    version: 'v2.1.1',
    acceptableArch: ['win32', 'darwin', 'linux'],
    acceptablePlataforms: ['x86', 'x64']
  },
  storyFormats: {
    useTweegoBuiltin: true,
  }
}

/**
 * Defines configs for use in Tweenode
 * @example
 * export default defineConfig({
 *   input: {
 *     storyDir: './src/story/'
 *   },
 *   output: {
 *   mode: 'file',
 *     fileName: './dist/index.html'  
 *   }
 * })
 * @param config {TweenodeConfiguration}
 */
export function defineConfig<T extends TweenodeConfiguration>(config: T): T {
  return { ...defaultConfig, ...config }
}