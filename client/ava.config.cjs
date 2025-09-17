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
  serial: true
}

const testEnv =
  (process.env.GIT_TAG_NAME && "remote") || process.env.TEST_ENV || "local"

if (testEnv === "local") {
  config.serial = false
}

if (testEnv === "remote") {
  /*
   * We have 5 parallel tests in our BrowserStack plan. But, when we try to run more than
   * 10 tests in parallel on BrowserStack, tests fail with a message indicating that all
   * parallel tests are in use.
   *
   * https://www.browserstack.com/question/617
   *
   * That's why we cannot run ava without `serial` or `concurrency` flags because,
   * the number of test files running at the same time is number of CPU cores.
   * Our best shot is to tell ava run one test file at a time and never keep more than
   * 10 parallel tests in a single test file.
   *
   * https://github.com/avajs/ava/blob/main/docs/05-command-line.md#cli
   *
   * Also please note that all report.js tests and some permissions.js tests are always
   * serialized with test.serialize for the time being.
   */
  config.serial = false
  config.concurrency = 1
}

/*
 * For ava.config.js files `export default` must be used
 *
 * https://github.com/avajs/ava/blob/main/docs/06-configuration.md#avaconfigjs
 */
module.exports = config
