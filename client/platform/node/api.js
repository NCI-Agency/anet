import jsyaml from 'js-yaml'
import fs from 'fs'
import BaseAPI from 'baseAPI'

console.log(`Using configuration file ` + process.argv[2])
const anetConfig = jsyaml.safeLoad(fs.readFileSync(process.argv[2], 'utf8'))
const Settings = anetConfig.dictionary
const API = BaseAPI

export {Settings, API as default}
