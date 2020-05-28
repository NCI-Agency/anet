import BaseAPI from "baseAPI"

const Settings = JSON.parse(window.ANET_DATA.dictionary)
const Version = window.ANET_DATA.projectVersion
const API = BaseAPI

export { Settings, Version, API as default }
