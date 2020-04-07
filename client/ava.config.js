/*
 * ava configuration file must be in the same directory as the package.json file
 * https://github.com/avajs/ava/blob/master/docs/06-configuration.md#alternative-configuration-files
 */

const config = {
  files: ["tests/e2e/*.js"],
  failFast: true,
  verbose: true,
  timeout: "3m",
  serial: true
}

const testEnv = (process.env.GIT_TAG_NAME && "remote") || process.env.TEST_ENV || "local"

if (testEnv === "local") {
  config.serial = false
} else {
  /*
   * we have 1 parallel execution in our browserstack plan. that's why there is no point of
   * running tests concurrently when TEST_ENV is not local. In fact, when we try to run more
   * than 6 tests in parallel on browserstack, tests fail with a message indicating that all
   * parallel test are in use.
   *
   * https://www.browserstack.com/question/617
   *
   * even on free trial plan with 5 parallel executions, we cannot run more than 10 tests
   * in parallel as we do when testing locally. when we run ava without `serial` or `concurrency`
   * flags, number of test files running at the same time is number of CPU cores.
   *
   * https://github.com/avajs/ava/blob/master/docs/05-command-line.md#cli
   *
   * that's why i used {serial:false, concurrency:1} config when runnig tests in parallel
   * on browserstack. results of my experiments on browserstack are as follows;
   * serial {serial: true} execution on browsertack took ~684 seconds
   * free trial plan with 5 parallel executions {serial:false, concurrency:1} took ~429 seconds
   *
   * also keep in mind that report.js test are always serialized with test.serialize
   */
  // config.serial = false
  // config.concurrency = 1
}

/*
 * For ava.config.js files `export default` must be used
 *
 * https://github.com/avajs/ava/blob/master/docs/06-configuration.md#avaconfigjs
 */
export default config
