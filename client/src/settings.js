import API from 'api'

let settings = JSON.parse(API.loadFileAjaxSync('/api/admin/dictionary', "application/json"))

export default settings
