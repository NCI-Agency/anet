import fs from "fs"
import BaseAPI from "baseAPI"
import jsyaml from "js-yaml"

console.log("Using configuration file " + process.argv[2])
const anetConfig = jsyaml.safeLoad(fs.readFileSync(process.argv[2], "utf8"))
const Settings = anetConfig.dictionary
const API = BaseAPI

export { Settings, API as default }
