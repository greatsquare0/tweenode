import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { fs, vol } from 'memfs'
import { resolve } from 'node:path'

import {
  downloadCustomStoryFormats,
  downloadTweego,
  extractTweego,
  getTweenodeFolderPath
} from '../src/download_tweego'

import { getTweegoUrl } from '../src/get_tweego_url'
import { defaultConfig } from '../src/handle_config'

const tweegoBinariePath = resolve(
  getTweenodeFolderPath(),
  process.platform == 'win32' ? './tweego.exe' : './tweego'
)

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('Tweego download and setup', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vol.reset()
    vol.mkdirSync(process.cwd(), { recursive: true })
  })

  it('Should download the correct given version of Tweego and create the Tweenode folder', async () => {
    const archiveName = getTweegoUrl().split('/').pop()

    await downloadTweego()

    expect(fs.existsSync(getTweenodeFolderPath())).toEqual(true)

    const content = fs.readdirSync(getTweenodeFolderPath())
    expect(content[0]).toEqual(archiveName)
  })

  it('Should correctly unzip the archive', async () => {
    await downloadTweego()
    await extractTweego()

    expect(fs.existsSync(tweegoBinariePath)).toEqual(true)
  })

  describe('Should correctly download specified storyformats', async () => {
    const path = resolve(getTweenodeFolderPath(), './storyformats')

    beforeEach(async () => {
      await downloadTweego()
      await extractTweego()

      fs.rmSync(path, { recursive: true })
      await downloadCustomStoryFormats()
    })

    const cases = defaultConfig.setup!.storyFormats!.formats!

    test.each(cases)(`$name format folder should exist`, ({ name }) => {
      const formatPath = resolve(path, name)
      expect(fs.existsSync(formatPath)).toEqual(true)
    })
  })
})
