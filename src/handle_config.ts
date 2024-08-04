import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { parse } from "smol-toml";

const projectRoot = process.cwd()

const configFileName = 'tweeno_config.toml'

const handleConfig = () => {
  if (existsSync(`${projectRoot}/${configFileName}`)) {
    return readConfigFile()

  } else {
    createConfigFile()
    return readConfigFile()
  }

}

const readConfigFile = () => {
  const configRaw = readFileSync(`${projectRoot}/${configFileName}`, 'utf-8')
  try {
    const parsedConfig = parse(configRaw) as any
    return parsedConfig

  } catch (error) {
    throw new Error(`Failed to parse the TOML: ${error}`)
  }
}

const createConfigFile = () => {
  try {
    copyFileSync(`${import.meta.dir}/config_template.toml`, `${projectRoot}/${configFileName}`)
    return
  } catch (error) {
    throw new Error(`Failed to create the TOML: ${error}`)
  }
}

export default handleConfig