import fetch from "sync-fetch"

// Fetch a bearer token for arthur
const user = "arthur"
const authResponse = fetch("http://localhost:9080/realms/ANET/protocol/openid-connect/token", {
  method: "POST",
  body: `client_id=ANET-Client-public&username=${user}&password=${user}&grant_type=password`,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  }
})
const authJson = authResponse.json()

// retrieve the GraphQL schema with the bearer token
const config = {
  projects: {
    anet: {
      schema: [
        {
          "http://localhost:8080/graphql": {
            headers: {
              Authorization: `Bearer ${authJson.access_token}`
            }
          }
        }
      ],
      extensions: {
        codegen: {
          generates: {
            "../src/test/resources/anet.graphql": {
              plugins: ["schema-ast"],
              config: {
                sort: true
              }
            }
          }
        }
      }
    }
  }
}

export default config
