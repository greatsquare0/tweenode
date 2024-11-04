import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export interface StoryFormat {
  name: string
  version?: string
  /**
   * Currently, not implemented
   */
  local?: boolean
  /**
   * If compacted, must be a zip
   */
  src?: string
  /**
   * Some may provide a folder inside the .zip (Like SugarCube), some won't, use this to create a folder for the format
   *
   * It will use the provided `name` property
   */
  createFolder?: boolean
}

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
     */
    head?: string
    /**
     * Path to your stylesheet (Naming may change in the future)
     */
    modules?: string
    /**
     * Use Twine test mode, some formats offer debug tools
     */
    forceDebug?: boolean
    /**
     * Array of aditional flags, like `--no-trim`
     */
    additionalFlags?: string[]
  }
}

export interface TweenodeSetupConfig {
  tweegoBinaries?: {
    version: string
    /**
     * Must be a .zip
     */
    customUrl?: string
  }
  /**
   * Used to donwload other formats not included in Tweego
   * (WIP)
   */
  storyFormats?: {
    /**
     * When `false`, it will delete all formats shipped with Tweego
     * @deprecated use cleanTweegoBuiltins
     */
    useTweegoBuiltin?: boolean
    /**
     * When `true`, it will delete all formats shipped with Tweego
     */
    cleanTweegoBuiltins: boolean
    /**
     * Array of custom formats to be downloaded
     */
    formats?: StoryFormat[]
  }
}

export interface TweenodeDebugConfig {
  writeToLog: boolean
  detachProcess: boolean
}

export interface TweenodeConfig {
  debug?: TweenodeDebugConfig
  build?: TweenodeBuildConfig
  setup?: TweenodeSetupConfig
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

  if (process.platform === 'win32') {
    configPath = pathToFileURL(configPath).href
  }

  const imported = await import(configPath)

  const config = imported.default
  cache = config
  return config
}

export const defaultConfig: Partial<TweenodeConfig> = {
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
  setup: {
    tweegoBinaries: {
      version: '2.1.1',
    },
    storyFormats: {
      cleanTweegoBuiltins: false,
      formats: [
        {
          name: 'sugarcube-2',
          version: '2.37.3',
          local: false,
          src: 'https://www.motoslave.net/sugarcube/download.php/2/sugarcube-2.37.3-for-twine-2.1-local.zip',
          createFolder: false,
        },
        {
          name: 'harlowe4-unstable',
          version: '4.0.0',
          src: 'https://twine2.neocities.org/harlowe4-unstable.js',
          createFolder: true,
        },
      ],
    },
  },
}

/**
 * Defines configs for use in Tweenode
 * # This may get removed
 * # Currently, only works as intended on Bun
 * @example
 * // ./tweenode.config.ts (Can be .js)
 *import { defineConfig, type TweenodeConfig } from 'tweenode'
 *
 * export default defineConfig({
 *   build: {
 *     input: {
 *       storyDir: './path/to/story/'
 *     },
 *     output: {
 *       mode:'file',
 *       fileName: './path/to/output/index.html'
 *     }
 *   },
 * })
 * @param config {TweenodeConfig}
 */
export function defineConfig<T extends TweenodeConfig>(config: T): T {
  return { ...defaultConfig, ...config }
}
