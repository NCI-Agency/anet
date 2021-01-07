import jsyaml from "js-yaml"
import { loadFileAjaxSync } from "../utils"

console.log("Using dictionary file " + process.env.STORYBOOK_ANET_DICTIONARY)
const anetConfig = jsyaml.load(
  loadFileAjaxSync(
    process.env.STORYBOOK_ANET_DICTIONARY,
    "text/yaml; charset=UTF-8"
  )
)
const Settings = anetConfig
const Version = "Storybook-Mode"

export { Version, Settings as default }
