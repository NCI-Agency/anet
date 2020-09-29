import fs from "fs"
import jsyaml from "js-yaml"

console.log("Using dictionary file " + process.env.ANET_DICTIONARY)
const anetConfig = jsyaml.safeLoad(
  fs.readFileSync(process.env.ANET_DICTIONARY, "utf8")
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
