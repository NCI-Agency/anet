import fs from "fs"
import jsyaml from "js-yaml"

console.log("Using configuration file " + process.env.ANET_CONFIG)
const anetConfig = jsyaml.safeLoad(
  fs.readFileSync(process.env.ANET_CONFIG, "utf8")
)
const Settings = anetConfig.dictionary
const {
  realm,
  "auth-server-url": url,
  resource: clientId,
  "show-logout-link": showLogoutLink
} = anetConfig.keycloakConfiguration
Settings.keycloakConfiguration = {
  realm,
  url,
  clientId,
  showLogoutLink
}

export default Settings
