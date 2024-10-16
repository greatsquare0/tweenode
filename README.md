# Tweenode

A neat NPM package and wrapper for [Tweego](https://github.com/tmedwards/tweego), downloads binaries from Tweego repo and expose a JS API

> Now on beta!

Aimed to be used with build scripts for more complex stories

## Basic usage

```js
import {Tweenode, setupTweego} from 'tweenode'

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

# test the app
pnpm run test

# build the app, available under dist
pnpm run build
```
---
### Special thanks to these projects (And the people behind them):


[sugarcube-starter by nijikokun](https://github.com/nijikokun/sugarcube-starter/) (Main source of inspiration)
[tweego-bin by double-a-stories](https://github.com/double-a-stories/tweego-bin)
[tweego-node by mattrossman](https://github.com/mattrossman/tweego-node)

## License

MIT

---

Created with [Bun-lib-starter](https://github.com/wobsoriano/bun-lib-starter)