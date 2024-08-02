import configHandler from "./handle_config"

export const projectRoot = process.cwd()

function helloNpm() {
  return configHandler()
}
export default helloNpm