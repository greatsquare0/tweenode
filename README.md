
<!-- <div align='center'>
  <img align='center' height='128px' alt='Logo' src=''>
</div> -->

<h1 align='center'>Tweenode</h1>

<p align='center'>
  A neat NPM package and wrapper for Tweego, downloads binaries from Tweego repo and expose a JS API
</p>

<div align='center'>
  <img alt="Version Badge"  src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fgreatsquare0%2Ftweenode%2Fmain%2Fpackage.json&query=%24.version&label=Version">
  <img alt="CI Workflow Status" src="https://img.shields.io/github/actions/workflow/status/greatsquare0/tweenode/ci.yml?style=flat&label=Testing">
  <img alt="Build Workflow Status" src="https://img.shields.io/github/actions/workflow/status/greatsquare0/tweenode/release.yml?style=flat&label=Release">
</div>

---

> Now on beta!

Aimed to be used with build scripts for more complex stories

## Basic usage

```js
import { Tweenode, setupTweego } from 'tweenode'

await setupTweego()

const tweego = new Tweenode()

await tweego.process({
  input: {
    storyDir: 'path/to/story',
  },
  output: {
    mode: 'file',
    fileName: 'path/to/output.html',
  },
})
```

## Development

### Requirements:

- [Bun](bun.sh)
- [pnpm](pnpm.io)

```bash
# install dependencies
pnpm install

# test the library with Vitest
pnpm run test

# build the library, available under dist/
pnpm run build
```
---
### Special thanks to these projects (And the people behind them):

[Tweego by tmedwards](https://github.com/tmedwards/tweego)
[sugarcube-starter by nijikokun](https://github.com/nijikokun/sugarcube-starter/) (Main source of inspiration)
[tweego-bin by double-a-stories](https://github.com/double-a-stories/tweego-bin)
[tweego-node by mattrossman](https://github.com/mattrossman/tweego-node)

## License

MIT

---

Created with [Bun-lib-starter](https://github.com/wobsoriano/bun-lib-starter)
