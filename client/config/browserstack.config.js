let util = require("util")
let config = require("config")
let user = config.has("browserstack_user")
  ? config.get("browserstack_user")
  : process.env.BROWSERSTACK_USER
let key = config.has("browserstack_key")
  ? config.get("browserstack_key")
  : process.env.BROWSERSTACK_ACCESS_KEY
let localIdentifier = config.has("browserstack_localIdentifier")
  ? config.get("browserstack_localIdentifier")
  : process.env.BROWSERSTACK_LOCAL_IDENTIFIER
let debug = config.has("browserstack_debug")
  ? config.get("browserstack_debug")
  : process.env.BROWSERSTACK_DEBUG

// Note: if the official timezone is "America/New_York", BrowserStack uses just "New_York"!
let moment = require("moment-timezone")
let localTz = moment.tz.guess()
let tzParts = localTz.split("/")
let bsTz = tzParts[tzParts.length - 1]

let capabilities = {
  maxInstances: 1,
  // Ideally, we'd like to test with:
  //   browserName: 'IE',
  //   browser_version: '11.0',
  // but that is so prone to unexpected failures as to be unusable.
  // So test with latest stable Chrome instead.
  browserName: "Chrome",
  browser_version: "75.0",
  "goog:chromeOptions": {
    // Maximize the window so we can see what's going on
    args: ["--start-maximized"]
  },
  os: "Windows",
  os_version: "7",
  resolution: "2048x1536",
  project: "ANET",
  build: require("git-describe").gitDescribeSync(".", { match: "[0-9]*" })
    .semverString,
  // Use the local timezone on BrowserStack
  "browserstack.timezone": bsTz,
  // Credentials for BrowserStack:
  "browserstack.user": user,
  "browserstack.key": key,
  // This requires that BrowserStackLocal is running!
  "browserstack.local": "true"
}
if (debug) {
  capabilities["browserstack.debug"] = debug
}
if (localIdentifier) {
  // For Travis CI
  capabilities["browserstack.localIdentifier"] = localIdentifier
}
capabilities.build = util.format(
  capabilities.build,
  capabilities.os,
  capabilities.os_version,
  capabilities.browserName,
  capabilities.browser_version
)

module.exports = capabilities
