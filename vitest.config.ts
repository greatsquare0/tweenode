import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    //setupFiles: ['./__tests__/vitest.setup.ts'],
    testTimeout: process.platform == 'win32' ? 50000 : 10000,
    hookTimeout: process.platform == 'win32' ? 50000 : 10000,
  },
})
