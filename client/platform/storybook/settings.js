import jsyaml from "js-yaml"
import { loadFileAjaxSync } from "../utils"

console.log("Using dictionary file " + process.env.STORYBOOK_ANET_DICTIONARY)
const anetConfig = jsyaml.safeLoad(
  loadFileAjaxSync(
    process.env.STORYBOOK_ANET_DICTIONARY,
    "text/yaml; charset=UTF-8"
  )
)
const Settings = anetConfig.dictionary

export default Settings
