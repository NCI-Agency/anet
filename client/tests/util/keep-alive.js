// Copied from https://raw.githubusercontent.com/AnkurGel/selenium-hub-utilities/master/keep-alive.js
// as suggested on https://www.browserstack.com/automate/node#add-on
// and then modified to remove eslint warnings

let http = require("http")
let https = require("https")

let keepAliveTimeout = 30 * 1000

if (http.globalAgent && http.globalAgent.hasOwnProperty("keepAlive")) {
  http.globalAgent.keepAlive = true
  https.globalAgent.keepAlive = true
  http.globalAgent.keepAliveMsecs = keepAliveTimeout
  https.globalAgent.keepAliveMsecs = keepAliveTimeout
} else {
  let agent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: keepAliveTimeout
  })

  let secureAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: keepAliveTimeout
  })

  let httpRequest = http.request
  let httpsRequest = https.request

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
