import fs from "fs"
import jsyaml from "js-yaml"

const anetConfigFile = "../application.yml"
console.log(`Using config file ${anetConfigFile}`)
const anetConfig = jsyaml.loadAll(fs.readFileSync(anetConfigFile, "utf8"))
const anetDictionaryFile =
  process.env.ANET_DICTIONARY || "../anet-dictionary.yml"
console.log(`Using dictionary file ${anetDictionaryFile}`)
const anetDictionary = jsyaml.load(fs.readFileSync(anetDictionaryFile, "utf8"))
const Settings = anetDictionary
const {
  realm,
  "auth-server-url": url,
  resource: clientId,
  "show-logout-link": showLogoutLink
} = anetConfig[0].anet["keycloak-configuration"]
Settings.keycloakConfiguration = {
  realm,
  url,
  clientId,
  showLogoutLink
}

export default Settings
