import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { resolve as pathResolve } from "path";
type Algorithm = 'sha256' | 'md5'


export const generateChecksum = (filePath: string, algorithm: Algorithm | string): Promise<string | Error> => {
  return new Promise((resolve, reject) => {

    const hash = createHash(algorithm)
    const fileSteam = createReadStream(pathResolve(process.cwd(), filePath))

    fileSteam.on('data', (chunk) => {
      hash.update(chunk)
    })

    fileSteam.on('end', () => {
      const checksum = hash.digest('hex')
      return resolve(checksum)
    })

    fileSteam.on('error', (error) => {
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
    await writeFile(pathResolve(process.cwd(), dist), Buffer.from(fileBuffer))

  } catch (error) {
    throw new Error(`Fetch error: ${error}`)
  }
}