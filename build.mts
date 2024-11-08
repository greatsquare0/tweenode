import dts from 'bun-plugin-dts'
import { removeSync } from 'fs-extra/esm'
import { resolve } from 'node:path'
import pkg from './package.json' assert { type: 'json' }

removeSync(resolve(process.cwd(), 'dist'))

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  sourcemap: 'external',
  target: 'node',
  format: 'esm',
  minify: false,
  external: [...Object.keys(pkg.dependencies)],
  plugins: [dts()],
})

console.log('Build finished')
