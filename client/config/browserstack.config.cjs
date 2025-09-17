const util = require("util")
const config = require("config")
const user = config.has("browserstack_user")
  ? config.get("browserstack_user")
  : process.env.BROWSERSTACK_USER
const key = config.has("browserstack_key")
  ? config.get("browserstack_key")
  : process.env.BROWSERSTACK_ACCESS_KEY
const localIdentifier = config.has("browserstack_localIdentifier")
  ? config.get("browserstack_localIdentifier")
  : process.env.BROWSERSTACK_LOCAL_IDENTIFIER
const debug = config.has("browserstack_debug")
  ? config.get("browserstack_debug")
  : process.env.BROWSERSTACK_DEBUG

// Note: if the official timezone is "America/New_York", BrowserStack uses just "New_York"!
const moment = require("moment-timezone")
const localTz = moment.tz.guess()
const tzParts = localTz.split("/")
const bsTz = tzParts[tzParts.length - 1]

const bstackOptions = {
  os: "Windows",
  osVersion: "10",
  resolution: "2048x1536",
  projectName: "ANET",
  // Use the local timezone on BrowserStack
  timezone: bsTz,
  // Credentials for BrowserStack:
  userName: user,
  accessKey: key,
  // This requires that BrowserStackLocal is running!
  local: "true",
  seleniumVersion: "4.1.2"
}
const capabilities = {
  maxInstances: 1,
  browserName: "Chrome",
  browserVersion: "latest",
  "goog:chromeOptions": {
    // Run in incognito mode
    // Maximize the window so we can see what's going on
    args: ["--incognito", "--start-maximized"]
  },
  "bstack:options": bstackOptions
}
if (debug) {
  bstackOptions.debug = debug
}
if (localIdentifier) {
  // For GitHub Actions
  bstackOptions.localIdentifier = localIdentifier
}

bstackOptions.buildName = util.format(
  require("git-describe").gitDescribeSync(".", { match: "[0-9]*" })
    .semverString,
  bstackOptions.os,
  bstackOptions.osVersion,
  capabilities.browserName,
  capabilities.browserVersion
)

module.exports = capabilities
