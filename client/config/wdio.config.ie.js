const util = require("util")
const config = require("./wdio.config.js").config

/*
 * Please note that IE tests are configured to run only on BrowserStack.
 * See `tests/util/wdio.ie.js` script for further details.
 */

// override default wdio config for IE tests
config.baseUrl = process.env.SERVER_URL
config.specs = ["../tests/webdriver/ie/**/*.spec.js"]
config.exclude = []

const capabilities = config.capabilities[0]
delete capabilities["goog:chromeOptions"]
capabilities.browserName = "IE"
capabilities.browserVersion = "11.0"

const bstackOptions = capabilities["bstack:options"]
bstackOptions.resolution = "1024x768"
bstackOptions.buildName = util.format(
  require("git-describe").gitDescribeSync(".", { match: "[0-9]*" })
    .semverString,
  bstackOptions.os,
  bstackOptions.osVersion,
  capabilities.browserName,
  capabilities.browserVersion
)

exports.config = config
