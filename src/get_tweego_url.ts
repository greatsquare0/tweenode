import { loadConfig } from "./handle_config";
const config = await loadConfig()

const ARCH_MAPPING = {
  ia32: 'x86',
  x64: 'x64',
} as const

const PLATFORM_MAPPING = {
  darwin: 'macos',
  linux: 'linux',
  win32: 'windows',
} as const

export const getTweegoUrl = () => {
  let { arch } = process

  if (process.arch === 'arm' || process.arch === 'arm64') {
    if (process.platform === 'darwin') {
      console.warn('This is an ARM64 macOS device. You will need Rosetta 2 for Tweego to work\nHighly untested, use at your risk')
      arch = 'x64'
    }

    if (process.platform === 'win32') {
      console.warn('This is an Windows for ARM device. You will need to run emulation\nHighly untested, use at your risk')
      arch = 'x64'
    }

  } else if (!(process.arch in ARCH_MAPPING) || !(process.platform in PLATFORM_MAPPING)) {
    throw new Error(`No Tweego binary for platform ${process.platform} (${arch})`)
  }

  //@ts-ignore
  const os = PLATFORM_MAPPING[process.platform]
  //@ts-ignore
  const architecture = ARCH_MAPPING[arch]

  return `https://github.com/tmedwards/tweego/releases/download/v${config.tweegoBinaries!.version}/tweego-${config.tweegoBinaries!.version}-${os}-${architecture}.zip`;
}