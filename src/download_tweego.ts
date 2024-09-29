import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import unzip from "extract-zip";

import { loadConfig } from "./handle_config";
import { downloadFile } from "./utils";
import { getTweegoUrl } from "./get_tweego_url";
const tweenodeFolderPath = resolve(process.cwd(), './.tweenode/')

console.log(tweenodeFolderPath)

const config = await loadConfig()

// interface FileStat {
//   name: string
//   hash: any
//   path: string
// }

// const generateLock = async (lockFilePath: string) => {
//   const tweenodeFolder = await readdir(tweenodeFolderPath, { recursive: true, withFileTypes: true })
//   const fileStats: FileStat[] = []

//   for await (const file of tweenodeFolder) {
//     if (file.isFile()) {
//       const filepath = resolve(file.parentPath, file.name)
//       if (!filepath.includes('LICENSE')) {
//         const hash = await generateChecksum(filepath, 'sha256')

//         fileStats.push({
//           name: file.name,
//           path: relative(process.cwd(), filepath),
//           hash: hash
//         })
//       }
//     }
//   }

//   writeFile(lockFilePath, JSON.stringify({
//     files: [
//       ...fileStats
//     ]
//   }, null, '\t'), { encoding: 'utf-8' })
// }

// const verifyLock = async (lockFilePath: string) => {
//   const lockFile = JSON.parse(await readFile(lockFilePath, { encoding: 'utf-8' })).files as FileStat[]
//   const tweenodeFolder = await readdir(tweenodeFolderPath, { recursive: true, withFileTypes: true })

//   const failedEntrys: FileStat[] = []
//   const notTracked = []

//   for await (const file of tweenodeFolder) {
//     if (file.isFile()) {
//       if (!file.name.includes('LICENSE')) {
//         const filepath = resolve(file.parentPath, file.name)
//         const hash = await generateChecksum(filepath, 'sha256')
//         const temp: FileStat = {
//           name: file.name,
//           path: relative(process.cwd(), filepath),
//           hash: hash
//         }

//         if (!lockFile.includes(temp)) {
//           notTracked.push(temp)
//         }
//       }
//     }
//   }

//   return failedEntrys
// }

// const verifyFiles = async () => {
//   const lockFilePath = resolve(tweenodeFolderPath, 'lock.json')
//   // if (existsSync(lockFilePath)) {
//   //   await rm(lockFilePath)
//   // }
//   // await generateLock(lockFilePath)
//   await verifyLock(lockFilePath)

// }

const downloadTweego = async () => {
  if (!existsSync(tweenodeFolderPath)) {
    await mkdir(tweenodeFolderPath)
  }

  const url = config.tweegoBinaries!.customUrl !== '' ? getTweegoUrl() : config.tweegoBinaries!.customUrl
  await downloadFile(url!, resolve(tweenodeFolderPath, url!.split('/').pop()!))
}

const extractTweego = async () => {
  const archiveName = getTweegoUrl().split('/').pop()
  await unzip(resolve(tweenodeFolderPath, archiveName!), { dir: tweenodeFolderPath })
  await rm(resolve(tweenodeFolderPath, archiveName!), { recursive: true })
}

const downloadCustomStoryFormats = async () => {
  for await (const format of config.storyFormats!.formats!) {
    const archiveName = format.src!.split('/').pop()

    let path = ''

    if (format.createFolder) {
      path = resolve(tweenodeFolderPath, `./storyformats/${format.name}`)

      if (!existsSync(path)) {
        await mkdir(path, { recursive: true })
      } else {
        await rm(path, { recursive: true })
        await mkdir(path, { recursive: true })
      }
    } else {
      path = resolve(tweenodeFolderPath, './storyformats/')
      const formatFolder = resolve(path, format.name)
      if (!existsSync(path)) {
        await mkdir(path, { recursive: true })
      }

      if (existsSync(formatFolder)) {
        await rm(formatFolder, { recursive: true })
      }
    }

    await downloadFile(format.src!, resolve(path, archiveName!))
    if (archiveName?.split('.').pop() == 'zip') {
      await unzip(resolve(path, archiveName!), { dir: path })
      await rm(resolve(path, archiveName!))
    }
  }



}

export const setupTweego = async () => {
  if (!existsSync(tweenodeFolderPath)) {
    await downloadTweego()
    await extractTweego()

    if (config.storyFormats!.formats!.length > 0) {
      await downloadCustomStoryFormats()
    }
  }
}