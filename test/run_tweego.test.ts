import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import { Tweenode } from '../src/run_tweego'
import { verifyBinarie } from '../src/verify_tweego'
import { setupTweego } from '../src/download_tweego'

vi.unmock('node:fs')
vi.unmock('node:fs/promises')
const localCwd = resolve(process.cwd(), 'test/tmp')

describe.only('Run Tweego', () => {
  let originalCwd = ''
  beforeEach(() => {
    vi.resetAllMocks()
    originalCwd = process.cwd()
    if (existsSync(localCwd)) {
      resetCwd(originalCwd)
    }
  })

  describe.skip('Verify Tweego Installation', () => {
    beforeEach(async () => {
      prepareCwd(originalCwd)
      await setupTweego()
    }, 20000)

    afterEach(() => {
      resetCwd(originalCwd)
    })

    it.skip('Should correctly setup and run', { repeats: 3 }, async () => {
      try {
        expect(await verifyBinarie()).toEqual(true)
      } catch (error) {
        console.log(error)
      }
    })
  })

  describe('Story compilation', () => {
    let tweego: InstanceType<typeof Tweenode>
    beforeEach(async () => {
      prepareCwd(originalCwd)
      await setupTweego()

      const files = [
        {
          name: 'StoryData.twee',
          content:
            ':: StoryData\n{\n"ifid": "D674C58C-DEFA-4F70-B7A2-27742230C0FC",\n"format": "SugarCube",\n"format-version": "2.30.0"\n}',
        },
        {
          name: 'Start.twee',
          content: ':: StoryTitle\nHello There!\n:: Start\nHello World!',
        },
      ]

      mkdirSync(resolve(localCwd, 'Story/'))

      for await (const file of files) {
        writeFileSync(resolve(localCwd, `Story/${file.name}`), file.content, {
          encoding: 'utf-8',
        })
      }

      tweego = new Tweenode()
    }, 999999)

    afterAll(() => {
      resetCwd(originalCwd)
    })

    it('should compile the story and return the code as a string', async () => {
      const result = await tweego.process({
        input: {
          storyDir: resolve(localCwd, 'Story/'),
        },
        output: {
          mode: 'string',
        },
      })

      expect(/^<!DOCTYPE\s+html>/.test(result!)).toBe(true)
    })

    it.todo('should compile the story and write the code to a file', () => {})
  })
})

const prepareCwd = (originalCwd: string) => {
  if (!existsSync(localCwd)) {
    mkdirSync(localCwd)
  }

  try {
    process.chdir(relative(originalCwd, localCwd))
  } catch (error) {
    throw new Error(`Error while changin cwd(): ${error}`)
  }
}

const resetCwd = (originalCwd: string) => {
  try {
    process.chdir(resolve(originalCwd))
  } catch (error) {
    throw new Error(`Error while changin cwd(): ${error}`)
  }

  if (existsSync(localCwd)) {
    rmSync(localCwd, { recursive: true })
  }
}
