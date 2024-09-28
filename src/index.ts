import { loadConfig } from './handle_config'

const tweenode = async () => {
  console.log(await loadConfig())
}

export default tweenode