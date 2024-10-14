import {
  createReadStream,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { resolve as pathResolve } from 'path'
import AdmZip from 'adm-zip'

export const generateChecksum = (
  filePath: string,
  algorithm: 'sha256' | 'md5' | string
): Promise<string | Error> => {
  return new Promise((resolve, reject) => {
    const hash = createHash(algorithm)
    const fileSteam = createReadStream(pathResolve(process.cwd(), filePath))

    fileSteam.on('data', (chunk: Buffer) => {
      const arrayBuffer = new Uint8Array(chunk)
      hash.update(arrayBuffer)
    })

    fileSteam.on('end', () => {
      const checksum = hash.digest('hex')
      return resolve(checksum)
    })

    fileSteam.on('error', error => {
      reject(error)
    })
  })
}

export const downloadFile = async (fileUrl: string, dist: string) => {
  try {
    const response = await fetch(fileUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const fileBuffer = await response.arrayBuffer()
    const arrayBuffer = new Uint8Array(fileBuffer)
    await writeFile(pathResolve(process.cwd(), dist), arrayBuffer)
  } catch (error) {
    throw new Error(`Fetch error: ${error}`)
  }
}

export const extract = async (zipPath: string, extractPath: string) => {
  const buffer = readFileSync(zipPath)
  const zip = new AdmZip(buffer)

  const zipEntries = zip.getEntries()

  for await (const entry of zipEntries) {
    const filePath = `${extractPath}/${entry.entryName}`

    if (entry.isDirectory) {
      mkdirSync(filePath, { recursive: true })
    } else {
      const arrayBuffer = new Uint8Array(entry.getData())
      writeFileSync(filePath, arrayBuffer)
    }
  }
}
