import { existsSync, mkdirSync, createWriteStream, rmSync } from "node:fs";


import fetch from "node-fetch";

import handleConfig from "./handle_config";
import ConfigTOML from "./types/config";
import extract from "extract-zip";

const projectRoot = process.cwd()
const tweeno_folder = `${projectRoot}/.tweeno`


const makeFolder = () => {

  if (!existsSync(tweeno_folder)) {
    try {
      mkdirSync(tweeno_folder + '/')
    } catch (error) {
      throw new Error(JSON.stringify(error))
    }
  }
}

const downloadTweego = async () => {
  const config = handleConfig() as ConfigTOML
  if (!config.tweego.binaries.acceptable_plataforms.includes(process.platform)) {
    throw new Error(`OS not compatible: ${process.platform}`)
  }

  if (!config.tweego.binaries.acceptable_arch.includes(process.arch)) {
    throw new Error(`Arch not compatible: ${process.arch}`)
  }

  makeFolder()

  if (existsSync(`${tweeno_folder}/tweego${process.platform == 'win32' ? '.exe' : null}`)) {
    return 'Exec alredy exists'
  }

  const fileName = await fetchAndSaveFile(config.tweego.binaries[process.platform][process.arch], tweeno_folder)

  try {
    await extract(`${tweeno_folder}/${fileName}`, { dir: tweeno_folder })
  } catch (error) {
    throw new Error(`Failed to extract zip: ${error}`)
  }

  try {
    rmSync(`${tweeno_folder}/${fileName}`)
  } catch (error) {
    throw new Error(`Failed to cleanup: ${error}`)
  }
}

const fetchAndSaveFile = async (fileUrl: string, pathToSave: string) => {
  const fileName = fileUrl.split('/').pop()
  const response = await fetch(fileUrl)

  if (!response.ok && response.body) {
    throw new Error(`Error while fetching file`)
  }

  const fileStream = createWriteStream(`${pathToSave}/${fileName}`)
  response.body!.pipe(fileStream)

  return new Promise((resolve, reject) => {
    fileStream.on('finish', () => resolve(fileName));
    fileStream.on('error', (err) => reject(err));
  })
}


export {
  downloadTweego
}