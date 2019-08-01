import fs from "fs"
import BaseAPI from "baseAPI"
import jsyaml from "js-yaml"

console.log("Using configuration file " + process.env.ANET_CONFIG)
const anetConfig = jsyaml.safeLoad(
  fs.readFileSync(process.env.ANET_CONFIG, "utf8")
)
const Settings = anetConfig.dictionary
const API = BaseAPI

export { Settings, API as default }
