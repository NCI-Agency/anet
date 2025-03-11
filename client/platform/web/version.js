import { keycloak } from "keycloak"
import { loadFileAjaxSync } from "../utils"

const GQL_GET_VERSION_INFO = `
  query {
    projectVersion
  }
`

const Version = JSON.parse(
  loadFileAjaxSync(
    "/graphql",
    "application/json",
    JSON.stringify({ query: GQL_GET_VERSION_INFO }),
    keycloak.token
  )
).data.projectVersion

export default Version
