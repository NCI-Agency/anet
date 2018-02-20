import API from 'api'

const Settings = JSON.parse(API.loadFileAjaxSync(API.addAuthParams("/api/admin/dictionary"), "application/json"))

export default Settings
