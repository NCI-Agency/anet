import API from 'api'

const Settings = JSON.parse(API.loadFileAjaxSync("/api/admin/dictionary", "application/json"))

export default Settings
