import jsyaml from "js-yaml"
import { loadFileAjaxSync } from "../utils"

console.log("Using dictionary file " + process.env.STORYBOOK_ANET_DICTIONARY)
const anetDictionary = jsyaml.load(
  loadFileAjaxSync(
    process.env.STORYBOOK_ANET_DICTIONARY,
    "text/yaml; charset=UTF-8"
  )
)
const Settings = anetDictionary
Settings.keycloakConfiguration = {}

export default Settings
