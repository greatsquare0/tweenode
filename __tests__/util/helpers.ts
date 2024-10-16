import process from 'node:process'
import { resolve } from 'path'
import { vi } from 'vitest'

const cwd = process.cwd()

export const viChdir = (path: string) => {
  vi.spyOn(process, 'cwd').mockReturnValue(resolve(cwd, '__tests__/temp', path))
}
