import { existsSync } from 'fs'
import { resolve } from 'node:path'

export interface StoryFormat {
  name: string
  version?: string
  local?: boolean
  src?: string
  createFolder?: boolean
}

export interface TweenodeBuildConfig {
  output: {
    mode: 'file' | 'string'
    fileName?: string
  }
  input: {
    storyDir: string
    head?: string
    modules?: string
    forceDebug?: boolean
    additionalFlags?: string[]
  }
}

export interface TweenodeSetupConfig {
  tweegoBinaries?: {
    version: string
    customUrl?: string
  }
  storyFormats?: {
    useTweegoBuiltin: boolean
    formats?: StoryFormat[]
  }
}

export interface TweenodeConfig {
  build: TweenodeBuildConfig
  setup: TweenodeSetupConfig
}

let cache: TweenodeConfig

export const loadConfig = async (
  customPath?: string
): Promise<TweenodeConfig> => {
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
    return defaultConfig as TweenodeConfig
  }

  const config = await import(configPath)

  cache = config
  return config
}

export const defaultConfig: Partial<TweenodeConfig> = {
  build: {
    output: {
      mode: 'string'
    },
    input: {
      storyDir: ''
    }
  },
  setup: {
    tweegoBinaries: {
      version: '2.1.1'
    },
    storyFormats: {
      useTweegoBuiltin: false,
      formats: [
        {
          name: 'sugarcube-2',
          version: '2.37.0',
          local: false,
          src: 'https://github.com/tmedwards/sugarcube-2/releases/download/v2.37.0/sugarcube-2.37.0-for-twine-2.1-local.zip',
          createFolder: false
        },
        {
          name: 'harlowe4-unstable',
          version: '4.0.0',
          src: 'https://twine2.neocities.org/harlowe4-unstable.js',
          createFolder: true
        }
      ]
    }
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
 * @param config {TweenodeConfig}
 */
export function defineConfig<T extends TweenodeConfig>(config: T): T {
  return { ...defaultConfig, ...config }
}
