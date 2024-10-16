import dts from 'bun-plugin-dts'
import { rmSync } from 'fs-extra'
import { resolve } from 'node:path'

rmSync(resolve(process.cwd(), 'dist'), { recursive: true, force: true })

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  sourcemap: 'external',
  target: 'node',
  minify: false,
  external: ['adm-zip', 'fs-extra'],
  plugins: [dts()],
})

console.log('Build finished')
