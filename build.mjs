import dts from 'bun-plugin-dts'
import { copyFileSync } from "node:fs";

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  sourcemap: 'external',
  target: 'node',
  minify: false,
  external: ['smol-toml'],
  plugins: [dts()],  
})

copyFileSync('./config_template.toml', './dist/config_template.toml')