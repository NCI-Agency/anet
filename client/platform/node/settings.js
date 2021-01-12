import fs from "fs"
import jsyaml from "js-yaml"

console.log("Using config file " + process.env.ANET_CONFIG)
const anetConfig = jsyaml.load(fs.readFileSync(process.env.ANET_CONFIG, "utf8"))
console.log("Using dictionary file " + process.env.ANET_DICTIONARY)
const anetDictionary = jsyaml.load(
  fs.readFileSync(process.env.ANET_DICTIONARY, "utf8")
)
const Settings = anetDictionary
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
