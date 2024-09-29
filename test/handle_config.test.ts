import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultConfig, defineConfig, loadConfig, type TweenodeConfiguration } from "../src/handle_config";

describe('Tweenode Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('defineConfig', () => {

    it('Should fall back to the default config if no config is provided', () => {
      const result = defineConfig({} as TweenodeConfiguration)
      expect(result).toEqual(defaultConfig)

    })

    it('Should merge the given config with default config', () => {
      const customConfig: TweenodeConfiguration = {
        build: {
          output: { mode: 'file', fileName: 'index.html' },
          input: { storyDir: './src/story' }
        },
        tweegoBinaries: {
          version: 'v2.2.0',
        },
        storyFormats: {
          useTweegoBuiltin: false,
          formats: [{ name: 'Example', version: '2.0', src: 'https://examplesource.com/file.zip' }]
        }
      }

      const result = defineConfig(customConfig)
      expect(result).toEqual({
        ...defaultConfig, ...customConfig
      })

    })
  })

  describe('loadConfig', () => {
    it('Should return the default config if no configuration file is found', async () => {
      const config = await loadConfig()
      expect(config).toEqual(defaultConfig)
    })


  })


})

