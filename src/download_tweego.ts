import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import unzip from "extract-zip";

import { loadConfig } from "./handle_config";
import { downloadFile, generateChecksum } from "./utils";
import { getTweegoUrl } from "./get_tweego_url";
const tweegoFolder = resolve(process.cwd(), './.tweenode/')

console.log(tweegoFolder)

const config = await loadConfig()

const checkCache = async () => { }




const downloadTweego = async () => {
  if (!existsSync(tweegoFolder)) {
    await mkdir(tweegoFolder)
  }

  const url = config.tweegoBinaries!.customUrl !== '' ? getTweegoUrl() : config.tweegoBinaries!.customUrl
  await downloadFile(url!, resolve(tweegoFolder, url!.split('/').pop()!))
}

const extractTweego = async () => {
  const archiveName = getTweegoUrl().split('/').pop()
  await unzip(resolve(tweegoFolder, archiveName!), { dir: tweegoFolder })
  await rm(resolve(tweegoFolder, archiveName!), { recursive: true })
}

const downloadCustomStoryFormats = () => {
  rm(resolve(tweegoFolder, './storyformats/'), { recursive: true })

  config.storyFormats!.formats!.forEach(async (format) => {
    if (!format.local) {
      const archiveName = format.src!.split('/').pop()

      let path = ''

      if (format.createFolder) {
        path = resolve(tweegoFolder, `./storyformat/${format.name}`)

        if (!existsSync(path)) {
          await mkdir(path, { recursive: true })
        }
      } else {
        path = resolve(tweegoFolder, './storyformat/')
        if (!existsSync(path)) {
          await mkdir(path, { recursive: true })
        }
      }

      await downloadFile(format.src!, resolve(path, archiveName!))
      if (archiveName?.split('.').pop() == 'zip') {
        await unzip(resolve(path, archiveName!), { dir: path })
        await rm(resolve(path, archiveName!))
      }
    }
  })
}

// await downloadTweego()
// await extractTweego()
// if (config.storyFormats!.useTweegoBuiltin == false) {
//   await downloadCustomStoryFormats()
// }