import { downloadTweego } from "./download_tweego";
import { runTweego, TweegoOptions } from "./run_tweego";

/**
 * Options for configuring the Tweego operation.
 * @property {@file} [head] - Optional head content to include.
 * @property {string} [module] - Optional module name.
 * @property {string} [scripts] - Optional scripts to include.
 * @property {string} input - The input file or directory.
 * @property {string} output - The output file or directory.
 * @property {boolean} [forceDebug] - Option to force debug mode.
 * @property {string[]} [additionalOptions] - Additional command-line options.
 */

/**
 * Download and run Tweego from JavaScript.
 * @param {TweegoOptions} options - Configuration options for Tweego.
 * @returns void
 */
const tweeno = async (options: TweegoOptions) => {
  await downloadTweego()
  return runTweego(options)
}

export default tweeno