import { initOptions, keycloak } from "keycloak"

keycloak
  .init({ onLoad: initOptions.onLoad })
  .then(authenticated => {
    if (!authenticated) {
      window.location.reload()
    } else {
      console.info("Authenticated successfully")
    }

    require("index.js")
  })
  .catch(() => {
    console.warn("Authentication failed")
  })

keycloak.onTokenExpired = () =>
  keycloak
    .updateToken()
    .then(refreshed => {
      console.info("Token refreshed")
    })
    .catch(() => {
      console.warn("Failed to refresh token, re-authentication is needed")
    })

export default keycloak
