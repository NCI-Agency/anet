// Copied from https://raw.githubusercontent.com/AnkurGel/selenium-hub-utilities/master/keep-alive.js
// as suggested on https://www.browserstack.com/automate/node#add-on
// and then modified to remove eslint warnings

const http = require("http")
const https = require("https")

const keepAliveTimeout = 30 * 1000

if (
  http.globalAgent &&
  Object.prototype.hasOwnProperty.call(http.globalAgent, "keepAlive")
) {
  http.globalAgent.keepAlive = true
  https.globalAgent.keepAlive = true
  http.globalAgent.keepAliveMsecs = keepAliveTimeout
  https.globalAgent.keepAliveMsecs = keepAliveTimeout
} else {
  const agent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: keepAliveTimeout
  })

  const secureAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: keepAliveTimeout
  })

  const httpRequest = http.request
  const httpsRequest = https.request

  http.request = function(options, callback) {
    if (options.protocol === "https:") {
      options.agent = secureAgent
      return httpsRequest(options, callback)
    } else {
      options.agent = agent
      return httpRequest(options, callback)
    }
  }
}
