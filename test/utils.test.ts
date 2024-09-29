import { beforeEach, describe, expect, test, vi } from "vitest";
import { fs, vol } from "memfs";
import { downloadFile, generateChecksum } from "../src/utils";

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('Utils', () => {
  beforeEach(() => {
    vol.reset()
    vi.resetAllMocks()
  })

  describe('generateChecksum', () => {
    describe('Should return a valid checksum given a file path and algorithm', () => {
      const path = '/testFile.txt'
      const cases = [
        {
          algorithm: 'md5',
          hash: '95b1f284c87cd5eec4ad1c88270c861e'
        },
        {
          algorithm: 'sha256',
          hash: '842287a9f1422491aee1ea72f5c2531eba451d288030a1a58749830bff67382f'
        }
      ]

      test.each(cases)(`File ${path} with algorithm: $algorithm, should result in the hash: $hash`, async ({ algorithm, hash }) => {
        fs.writeFileSync(path, 'lorem ipsum sit dolor amen', { encoding: "utf-8" })
        const result = await generateChecksum(path, algorithm)
        expect(result).toEqual(hash)
      })

    })
  })

  describe.skip('downloadFile', () => {
    const genericTestFiles = [
      {
        url: 'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/360/Big_Buck_Bunny_360_10s_1MB.webm',
        hash: '6b2afedd9fa041fdff5d9e1d6d909c393268669005041c572abcc5923c939c58'
      },
      {
        url: 'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/720/Big_Buck_Bunny_720_10s_2MB.webm',
        hash: 'e059378d52d93277ceaa1c8137122e4acda87b8e3a891a2804a7386162b37235'
      },
      {
        url: 'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/1080/Big_Buck_Bunny_1080_10s_5MB.webm',
        hash: '3011a3d7dc742d6c0f37194ba8273e6b09b90fe768d5f11386ff140bc6745d52'
      }
    ]

    describe('Should be able to successively download and save a file', () => {

      test.each(genericTestFiles)(`Donwloading file: $url with checksum $hash`, async ({ url, hash }) => {
        fs.mkdirSync('/tmp/download', { recursive: true })
        const path = `/tmp/download/${crypto.randomUUID()}.webm`
        await downloadFile(url, path)
        const result = await generateChecksum(path, 'sha256')
        expect(result).toEqual(hash)

      })
    })
  })
})
