import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { join, resolve as pathResolve } from 'node:path'
import { outputFile, readFile } from 'fs-extra'
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
    await outputFile(pathResolve(process.cwd(), dist), arrayBuffer)
  } catch (error) {
    throw new Error(`Fetch error: ${error}`)
  }
}

export const extract = async (zipPath: string, extractPath: string) => {
  const buffer = await readFile(zipPath)
  const zip = new AdmZip(buffer)
  const zipEntries = zip.getEntries()

  const extractPromises = zipEntries.map(async entry => {
    const filePath = join(extractPath, entry.entryName)

    if (entry.isDirectory) {
      await mkdir(filePath, { recursive: true })
    } else {
      const data = new Uint8Array(entry.getData())
      await outputFile(filePath, data)
    }
  })

  await Promise.all(extractPromises)
}
