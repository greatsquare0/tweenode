import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { parse } from "smol-toml";
import { fileURLToPath } from "url";
import { dirname } from "path";

const projectRoot = process.cwd()

const configFileName = 'tweenode_config.toml'

const handleConfig = () => {
  if (existsSync(`${projectRoot}/${configFileName}`)) {
    return readConfigFile()

  } else {
    createConfigFile()
    return readConfigFile()
  }

}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    copyFileSync(`${__dirname}/config_template.toml`, `${projectRoot}/${configFileName}`)
    return
  } catch (error) {
    throw new Error(`Failed to create the TOML: ${error}`)
  }
}

export default handleConfig