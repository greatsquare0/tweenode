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
import { resolve } from 'node:path'

import { tweenode, TweenodeInstance } from '../src/run_tweego'
import { verifyBinarie } from '../src/verify_tweego'
import { setupTweego } from '../src/download_tweego'

vi.unmock('node:fs')
vi.unmock('node:fs/promises')
const localCwd = resolve(process.cwd(), 'test/tmp')

describe.only('Run Tweego', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    if (existsSync(localCwd)) {
      resetCwd()
    }
  })

  describe.skip('Verify Tweego Installation', () => {
    beforeEach(async () => {
      prepareCwd()
      await setupTweego()
    }, 20000)

    afterEach(() => {
      resetCwd()
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
    let tweego: TweenodeInstance
    beforeEach(async () => {
      prepareCwd()
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

      tweego = tweenode()
    }, 999999)

    afterEach(() => {
      resetCwd()
    })

    it(
      'should compile the story and return the code as a string',
      { timeout: 99999 },
      async () => {
        await tweego.process({
          input: {
            storyDir: resolve(localCwd, 'Story/'),
          },
          output: {
            mode: 'string',
          },
        })

        expect(/^<!DOCTYPE\s+html>/.test(tweego.code!)).toBe(true)
      }
    )

    it.todo('should compile the story and write the code to a file', () => {})
  })
})

const prepareCwd = () => {
  if (!existsSync(localCwd)) {
    mkdirSync(localCwd)
  }
}

const resetCwd = () => {
  if (existsSync(localCwd)) {
    rmSync(localCwd, { recursive: true })
  }
}
