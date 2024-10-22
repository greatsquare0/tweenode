import {
  describe,
  it,
  vi,
  afterEach,
  beforeEach,
  expect,
  afterAll,
  beforeAll,
} from 'vitest'
import { setupTweego } from '../src/download_tweego'
import { nanoid } from 'nanoid'
import { viChdir } from './util/helpers'
import { verifyBinarie } from '../src/verify_tweego'
import { existsSync, outputFile, rmSync } from 'fs-extra'
import { resolve } from 'node:path'
import { Tweenode } from '../src/run_tweego'

describe('Run Tweego', () => {
  beforeAll(() => {
    rmSync(resolve(process.cwd(), '__tests__/temp/run/'), {
      recursive: true,
      force: true,
    })
  })

  beforeEach(() => {
    viChdir('run')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(() => {
    rmSync(resolve(process.cwd(), '__tests__/temp/util'), {
      recursive: true,
      force: true,
    })
  })

  describe('Verify Tweego Installation', () => {
    beforeEach(async () => {
      viChdir(resolve(process.cwd(), `${nanoid(6)}/`))
      await setupTweego()
    })

    afterEach(() => {
      rmSync(process.cwd(), { recursive: true, force: true })
    })

    it('should correctly setup and run', { repeats: 3 }, async () => {
      expect(await verifyBinarie()).toEqual(true)
    })
  })

  describe('Story compilation', () => {
    let path = ''
    beforeEach(async () => {
      viChdir(resolve(process.cwd(), `${nanoid(6)}/`))
      path = process.cwd()
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

      for await (const file of files) {
        await outputFile(
          resolve(process.cwd(), `Story/${file.name}`),
          file.content,
          {
            encoding: 'utf-8',
          }
        )
      }
    })

    afterAll(() => {
      rmSync(path, { recursive: true, force: true })
    })

    it('should compile the story and return the code as a string', async () => {
      const tweego = new Tweenode()
      const result = await tweego.process({
        input: {
          storyDir: resolve(process.cwd(), 'Story/'),
        },
        output: {
          mode: 'string',
        },
      })

      expect(/^<!DOCTYPE\s+html>/.test(result!)).toBe(true)
    })

    it('should compile the story and write the code to a file', async () => {
      const tweego = new Tweenode()
      await tweego.process({
        input: {
          storyDir: resolve(process.cwd(), 'Story/'),
        },
        output: {
          mode: 'file',
          fileName: 'dist/index.html',
        },
      })

      expect(existsSync('dist/index.html')).toBe(true)
    })
  })
})
