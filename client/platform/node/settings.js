import fs from "fs"
import jsyaml from "js-yaml"

console.log("Using dictionary file " + process.env.ANET_DICTIONARY)
const anetConfig = jsyaml.safeLoad(
  fs.readFileSync(process.env.ANET_DICTIONARY, "utf8")
)
const Settings = anetConfig.dictionary

export default Settings
