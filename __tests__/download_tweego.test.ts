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
} from '../src/download_tweego'
import { getTweegoUrl } from '../src/get_tweego_url'
import { defaultConfig } from '../src/handle_config'
import { viChdir } from './util/helpers'
import { nanoid } from 'nanoid'

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
    const archiveName = getTweegoUrl().split('/').pop()

    await downloadTweego()

    expect(existsSync(getTweenodeFolderPath())).toEqual(true)

    const content = readdirSync(getTweenodeFolderPath())
    expect(content[0]).toEqual(archiveName)
  })

  it('Should correctly unzip the archive', { timeout: 32000 }, async () => {
    await downloadTweego()
    await extractTweego()
    expect(existsSync(getTweegoBinariePath())).toEqual(true)
  })

  describe.todo(
    'Should correctly download specified storyformats',
    { timeout: 99999 },
    async () => {
      let path = ''

      beforeAll(async () => {
        viChdir(`download_and_setup/${nanoid(6)}`)

        console.log(process.cwd())
        path = resolve(process.cwd(), '.tweenode/storyformats')
        await downloadTweego()
        await extractTweego()

        rmSync(path, { recursive: true, force: true })
        await downloadCustomStoryFormats()
      }, 99999)

      const cases = defaultConfig.setup!.storyFormats!.formats!

      test.each(cases)(`$name format folder should exist`, ({ name }) => {
        const formatPath = resolve(path, name)
        console.log(readdirSync(process.cwd(), { recursive: true }))
        expect(existsSync(formatPath)).toEqual(true)
      })
    }
  )
})
