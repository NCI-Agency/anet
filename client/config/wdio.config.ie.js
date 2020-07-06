const config = require("./wdio.config.js").config

/*
 * Please note that IE tests are configured to run only on BrowserStack.
 * See `tests/util/wdio.ie.js` script for further details.
 */

// override default wdio config for IE tests
config.baseUrl = process.env.SERVER_URL
config.specs = ["./tests/webdriver/specs/ie/*.spec.js"]
config.exclude = []

const capabilities = config.capabilities[0]
delete capabilities["goog:chromeOptions"]

capabilities.browserName = "IE"
capabilities.browser_version = "11.0"
capabilities.build = require("git-describe").gitDescribeSync(".", {
  match: "[0-9]*"
}).semverString

capabilities.build = require("util").format(
  capabilities.build,
  capabilities.os,
  capabilities.os_version,
  capabilities.browserName,
  capabilities.browser_version
)

exports.config = config
