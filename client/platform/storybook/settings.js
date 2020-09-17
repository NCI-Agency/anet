import jsyaml from "js-yaml"
import { loadFileAjaxSync } from "../utils"

console.log("Using configuration file " + process.env.STORYBOOK_ANET_CONFIG)
const anetConfig = jsyaml.safeLoad(
  loadFileAjaxSync(
    process.env.STORYBOOK_ANET_CONFIG,
    "text/yaml; charset=UTF-8"
  )
)
const Settings = anetConfig.dictionary

export default Settings
