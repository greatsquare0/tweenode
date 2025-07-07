import {
  vi,
  describe,
  beforeEach,
  it,
  expect,
  test,
  afterEach,
  beforeAll,
} from 'vitest'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import {} from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  downloadTweego,
  getTweenodeFolderPath,
  extractTweego,
  downloadCustomStoryFormats,
  setupDefaults,
  TweenodeSetupOptions,
} from '../src/download_tweego'
import { getTweegoUrl } from '../src/get_tweego_url'
import { viChdir } from './util/helpers'
import { nanoid } from 'nanoid'
import { removeSync } from 'fs-extra'

const getTweegoBinariePath = () =>
  resolve(
    getTweenodeFolderPath(),
    process.platform == 'win32' ? './tweego.exe' : './tweego'
  )

describe('Tweego download and setup', () => {
  beforeAll(() => {
    rmSync(resolve(process.cwd(), '__tests__/temp/download_and_setup/'), {
      recursive: true,
      force: true,
    })
  })

  beforeEach(() => {
    vi.resetAllMocks()
    viChdir(`download_and_setup/${nanoid(6)}`)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rmSync(resolve(process.cwd(), '__tests__/temp/download_and_setup/'), {
      recursive: true,
      force: true,
    })
  })

  it('Should download the correct given version of Tweego and create the Tweenode folder', async () => {
    const config = setupDefaults as unknown as TweenodeSetupOptions
    const archiveName = getTweegoUrl(config).split('/').pop()

    await downloadTweego()

    expect(existsSync(getTweenodeFolderPath())).toEqual(true)

    const content = readdirSync(getTweenodeFolderPath())
    expect(content[0]).toEqual(archiveName)
  })

  it('Should correctly unzip the archive', async () => {
    await downloadTweego()
    await extractTweego()
    expect(existsSync(getTweegoBinariePath())).toEqual(true)
  })

  describe('Should correctly download specified storyformats', async () => {
    let path = ''

    beforeEach(async () => {
      viChdir(`download_and_setup/${nanoid(6)}`)

      path = resolve(process.cwd(), '.tweenode/storyformats')
      await downloadTweego()
      await extractTweego()

      removeSync(path)
      await downloadCustomStoryFormats()
    })

    const cases = setupDefaults!.storyFormats!.formats!

    test.each(cases)(`$name format folder should exist`, ({ name }) => {
      const formatPath = resolve(path, name)

      expect(existsSync(formatPath)).toEqual(true)
    })
  })
})
