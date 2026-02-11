/*
 * ava configuration file must be in the same directory as the package.json file
 *
 * https://github.com/avajs/ava/blob/main/docs/06-configuration.md#alternative-configuration-files
 */

const config = {
  files: ["tests/e2e/*.js"],
  failFast: true,
  verbose: true,
  timeout: "3m",
  serial: false
}

/*
 * For ava.config.js files `export default` must be used
 *
 * https://github.com/avajs/ava/blob/main/docs/06-configuration.md#avaconfigjs
 */
module.exports = config
