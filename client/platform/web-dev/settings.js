import { loadFileAjaxSync } from "../utils"

const Settings = JSON.parse(
  loadFileAjaxSync("/api/admin/dictionary", "application/json")
)
const GQL_GET_VERSION_INFO = `
  query {
    projectVersion
  }
`

const Version = JSON.parse(
  loadFileAjaxSync(
    "/graphql",
    "application/json",
    JSON.stringify({ query: GQL_GET_VERSION_INFO })
  )
).data.projectVersion

export { Version, Settings as default }
