import dts from 'bun-plugin-dts'
import { removeSync } from 'fs-extra/esm'
import { resolve } from 'node:path'

removeSync(resolve(process.cwd(), 'dist'))

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  sourcemap: 'external',
  target: 'node',
  format: 'esm',
  minify: false,
  external: ['adm-zip', 'fs-extra'],
  plugins: [dts()],
})

console.log('Build finished')
