import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

import { config } from './state'
import { downloadFile, extract } from './utils'
import { getTweegoUrl } from './get_tweego_url'
import { StoryFormat, TweenodeSetupConfig } from './handle_config'
import { emptyDir } from 'fs-extra'

export const getTweenodeFolderPath = () => {
  return resolve(process.cwd(), './.tweenode/')
}

// interface FileStat {
//   name: string
//   hash: any
//   path: string
// }

// const generateLock = async (lockFilePath: string) => {
//   const tweenodeFolder = await readdir(getTweenodeFolderPath(), { recursive: true, withFileTypes: true })
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
//   const tweenodeFolder = await readdir(getTweenodeFolderPath(), { recursive: true, withFileTypes: true })

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
//   const lockFilePath = resolve(getTweenodeFolderPath(), 'lock.json')
//   // if (existsSync(lockFilePath)) {
//   //   await rm(lockFilePath)
//   // }
//   // await generateLock(lockFilePath)
//   await verifyLock(lockFilePath)

// }

export const downloadTweego = async (options?: TweenodeSetupConfig) => {
  let usedConfig = config.setup!.tweegoBinaries!
  if (options?.tweegoBinaries) {
    usedConfig = options!.tweegoBinaries
  }

  if (!existsSync(getTweenodeFolderPath())) {
    await mkdir(getTweenodeFolderPath(), { recursive: true })
  }

  const url =
    usedConfig!.customUrl !== '' ? getTweegoUrl() : usedConfig!.customUrl
  await downloadFile(
    url!,
    resolve(getTweenodeFolderPath(), url!.split('/').pop()!)
  )
}

export const extractTweego = async () => {
  const archiveName = getTweegoUrl().split('/').pop()
  const archivePath = resolve(getTweenodeFolderPath(), archiveName!)

  await extract(archivePath, getTweenodeFolderPath())
  await rm(archivePath)
}

export const downloadCustomStoryFormats = async (
  options?: TweenodeSetupConfig
) => {
  let usedConfig = config.setup!.storyFormats
  if (options?.storyFormats) {
    usedConfig = options?.storyFormats
  }

  if (usedConfig!.cleanTweegoBuiltins) {
    await emptyDir(resolve(getTweenodeFolderPath(), './storyformats/'))
  }

  for await (const format of usedConfig!.formats!) {
    await downloadFormat(format)
  }
}

const downloadFormat = async (format: StoryFormat) => {
  const downloadedFileName = format.src!.split('/').pop()
  let finalName = ''
  let path = ''

  if (downloadedFileName!.split('.').pop() == 'zip') {
    finalName = downloadedFileName!
  } else {
    if (downloadedFileName! !== 'format.js') {
      finalName = 'format.js'
    } else {
      finalName = downloadedFileName
    }
  }

  if (format.createFolder) {
    path = resolve(getTweenodeFolderPath(), `./storyformats/${format.name}`)

    if (!existsSync(path)) {
      await mkdir(path, { recursive: true })
    } else {
      await rm(path, { recursive: true })
      await mkdir(path, { recursive: true })
    }
  } else {
    path = resolve(getTweenodeFolderPath(), './storyformats/')
    const formatFolder = resolve(path, format.name)
    if (!existsSync(path)) {
      await mkdir(path, { recursive: true })
    }

    if (existsSync(formatFolder)) {
      await rm(formatFolder, { recursive: true })
    }
  }

  await downloadFile(format.src!, resolve(path, finalName!))
  if (finalName?.split('.').pop() == 'zip') {
    await extract(resolve(path, finalName!), path)
    await rm(resolve(path, finalName!))
  }
}

export const setupTweego = async (options?: TweenodeSetupConfig) => {
  if (!existsSync(getTweenodeFolderPath())) {
    await downloadTweego(options)
    await extractTweego()

    if (
      config.setup!.storyFormats!.formats!.length > 0 ||
      options!.storyFormats!.formats!.length > 0
    ) {
      await downloadCustomStoryFormats(options)
    }
  }
}
