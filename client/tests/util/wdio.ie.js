const testEnv =
  (process.env.GIT_TAG_NAME && "remote") || process.env.TEST_ENV || "local"

if (testEnv === "local") {
  console.log(
    "IE tests are configured to run on BrowserStack only. Skipping IE tests while running locally."
  )
  process.exit(0)
}

/*
 * We want to run IE related tests only on BrowserStack. That's why we need to
 * gracefully abort the execution if tests are running locally. It seems that
 * wdio doesn't provide a way to gracefully abort the execution by means of
 * configuration or command line arguments. If it was possible, we wouldn't need
 * a dedicated script for running IE tests and we would handle the case only
 * with a dedicated configuration. Also, a workaround could be to provide a
 * configuration with no specs. However, when wdio command is executed with no
 * specs, the process terminates with a non-zero exit status.
 *
 * Consequently, we execute test runner programatically.
 *
 * For running the test runner programmatically, please see:
 * https://webdriver.io/docs/clioptions.html#run-the-test-runner-programmatically
 */
import("@wdio/cli").then(cli =>
  // config file path is relative to the directory where package.json resides
  new cli.Launcher("./config/wdio.config.ie.js").run().then(
    code => process.exit(code),
    error => {
      console.error("Launcher failed to start the test!", error.stacktrace)
      process.exit(1)
    }
  )
)
