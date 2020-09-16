import { loadFileAjaxSync } from "../utils"

const Settings = JSON.parse(
  loadFileAjaxSync("/api/admin/dictionary", "application/json")
)

export default Settings
