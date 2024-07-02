import fs from "fs"
import jsyaml from "js-yaml"

const anetConfigFile = process.env.ANET_CONFIG || "../anet.yml"
console.log(`Using config file ${anetConfigFile}`)
const anetConfig = jsyaml.load(fs.readFileSync(anetConfigFile, "utf8"))
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
} = anetConfig.keycloakConfiguration
Settings.keycloakConfiguration = {
  realm,
  url,
  clientId,
  showLogoutLink
}

export default Settings
