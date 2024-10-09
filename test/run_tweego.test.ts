import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fs, vol } from 'memfs'

import { tweenode } from '../src/run_tweego'
import { verifyBinarie } from '../src/verify_tweego'
import { setupTweego } from '../src/download_tweego'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe.todo('Run Tweego', () => {
  beforeEach(() => {
    vol.reset()
    vi.resetAllMocks()
  })

  describe('Verify Tweego Installation', () => {})
})
