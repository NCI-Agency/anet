import { loadFileAjaxSync } from "../utils"

const Settings = JSON.parse(
  loadFileAjaxSync("/api/admin/dictionary", "application/json")
)
const Version = "Dev-Mode"

export { Version, Settings as default }
